use super::*;
use frame_support::IterableStorageMap;
use sp_core::Get;

impl<T: Config> Pallet<T> {
    /// Retrieves the unique identifier (UID) for the root network.
    ///
    /// The root network is a special case and has a fixed UID of 0.
    ///
    /// # Returns:
    /// * 'u16': The UID for the root network.
    ///
    pub fn get_root_netuid() -> u16 {
        0
    }

    /// Fetches the total count of subnets.
    ///
    /// This function retrieves the total number of subnets present on the chain.
    ///
    /// # Returns:
    /// * 'u16': The total number of subnets.
    ///
    pub fn get_num_subnets() -> u16 {
        TotalNetworks::<T>::get()
    }

    /// Returns true if the subnetwork exists.
    ///
    /// This function checks if a subnetwork with the given UID exists.
    ///
    /// # Returns:
    /// * 'bool': Whether the subnet exists.
    ///
    pub fn if_subnet_exist(netuid: u16) -> bool {
        NetworksAdded::<T>::get(netuid)
    }

    /// Returns a list of subnet netuid equal to total networks.
    ///
    ///
    /// This iterates through all the networks and returns a list of netuids.
    ///
    /// # Returns:
    /// * 'Vec<u16>': Netuids of all subnets.
    ///
    pub fn get_all_subnet_netuids() -> Vec<u16> {
        <NetworksAdded<T> as IterableStorageMap<u16, bool>>::iter()
            .map(|(netuid, _)| netuid)
            .collect()
    }

    /// Returns the mechanism id for a subnet.
    ///
    ///
    /// This checks the Mechanism map for the value, defaults to 0.
    ///
    /// # Args:
    /// * 'u16': The subnet netuid
    ///
    /// # Returns:
    /// * 'u16': The subnet mechanism
    ///
    pub fn get_subnet_mechanism(netuid: u16) -> u16 {
        SubnetMechanism::<T>::get(netuid)
    }

    /// Finds the next available mechanism ID.
    ///
    /// This function iterates through possible mechanism IDs starting from 0
    /// until it finds an ID that is not currently in use.
    ///
    /// # Returns
    /// * `u16` - The next available mechanism ID.
    pub fn get_next_netuid() -> u16 {
        let mut next_netuid = 1; // do not allow creation of root
        let netuids: Vec<u16> = Self::get_all_subnet_netuids();
        loop {
            if !netuids.contains(&next_netuid) {
                break next_netuid;
            }
            next_netuid = next_netuid.saturating_add(1);
        }
    }

    /// Sets the network rate limit and emit the `NetworkRateLimitSet` event
    ///
    pub fn set_network_rate_limit(limit: u64) {
        NetworkRateLimit::<T>::set(limit);
        Self::deposit_event(Event::NetworkRateLimitSet(limit));
    }

    /// Checks if registrations are allowed for a given subnet.
    ///
    /// This function retrieves the subnet hyperparameters for the specified subnet and checks the
    /// `registration_allowed` flag. If the subnet doesn't exist or doesn't have hyperparameters
    /// defined, it returns `false`.
    ///
    /// # Arguments
    ///
    /// * `netuid` - The unique identifier of the subnet.
    ///
    /// # Returns
    ///
    /// * `bool` - `true` if registrations are allowed for the subnet, `false` otherwise.
    pub fn is_registration_allowed(netuid: u16) -> bool {
        Self::get_subnet_hyperparams(netuid)
            .map(|params| params.registration_allowed)
            .unwrap_or(false)
    }

    /// Facilitates user registration of a new subnetwork.
    ///
    /// # Args:
    /// * 'origin': ('T::RuntimeOrigin'): The calling origin. Must be signed.
    /// * `identity` (`Option<SubnetIdentityOf>`): Optional identity to be associated with the new subnetwork.
    ///
    /// # Event:
    /// * 'NetworkAdded': Emitted when a new network is successfully added.
    ///
    /// # Raises:
    /// * 'TxRateLimitExceeded': If the rate limit for network registration is exceeded.
    /// * 'NotEnoughBalanceToStake': If there isn't enough balance to stake for network registration.
    /// * 'BalanceWithdrawalError': If an error occurs during balance withdrawal for network registration.
    /// * `SubnetIdentitySet(netuid)`: Emitted when a custom identity is set for a new subnetwork.
    /// * `SubnetIdentityRemoved(netuid)`: Emitted when the identity of a removed network is also deleted.
    ///
    pub fn do_register_network(
        origin: T::RuntimeOrigin,
        hotkey: &T::AccountId,
        mechid: u16,
        identity: Option<SubnetIdentityOfV2>,
    ) -> DispatchResult {
        // --- 1. Ensure the caller is a signed user.
        let coldkey = ensure_signed(origin)?;

        // --- 2. Ensure the hotkey does not exist or is owned by the coldkey.
        ensure!(
            !Self::hotkey_account_exists(hotkey) || Self::coldkey_owns_hotkey(&coldkey, hotkey),
            Error::<T>::NonAssociatedColdKey
        );

        // --- 3. Ensure the mechanism is Dynamic.
        ensure!(mechid == 1, Error::<T>::MechanismDoesNotExist);

        // --- 4. Rate limit for network registrations.
        let current_block = Self::get_current_block_as_u64();
        let last_lock_block = Self::get_network_last_lock_block();
        ensure!(
            current_block.saturating_sub(last_lock_block) >= NetworkRateLimit::<T>::get(),
            Error::<T>::NetworkTxRateLimitExceeded
        );

        // --- 5. Calculate and lock the required tokens.
        let lock_amount: u64 = Self::get_network_lock_cost();
        log::debug!("network lock_amount: {:?}", lock_amount);
        ensure!(
            Self::can_remove_balance_from_coldkey_account(&coldkey, lock_amount),
            Error::<T>::NotEnoughBalanceToStake
        );

        // --- 5. Determine the netuid to register.
        let netuid_to_register: u16 = Self::get_next_netuid();

        // --- 6. Perform the lock operation.
        let actual_tao_lock_amount: u64 =
            Self::remove_balance_from_coldkey_account(&coldkey, lock_amount)?;
        log::debug!("actual_tao_lock_amount: {:?}", actual_tao_lock_amount);

        // --- 7. Set the lock amount for use to determine pricing.
        Self::set_network_last_lock(actual_tao_lock_amount);

        // --- 8. Set initial and custom parameters for the network.
        let default_tempo = DefaultTempo::<T>::get();
        Self::init_new_network(netuid_to_register, default_tempo);
        log::debug!("init_new_network: {:?}", netuid_to_register);

        // --- 9 . Add the caller to the neuron set.
        Self::create_account_if_non_existent(&coldkey, hotkey);
        Self::append_neuron(netuid_to_register, hotkey, current_block);
        log::debug!(
            "Appended neuron for netuid {:?}, hotkey: {:?}",
            netuid_to_register,
            hotkey
        );

        // --- 10. Set the mechanism.
        SubnetMechanism::<T>::insert(netuid_to_register, mechid);
        log::debug!(
            "SubnetMechanism for netuid {:?} set to: {:?}",
            netuid_to_register,
            mechid
        );

        // --- 11. Set the creation terms.
        NetworkLastRegistered::<T>::set(current_block);
        NetworkRegisteredAt::<T>::insert(netuid_to_register, current_block);

        // --- 14. Init the pool by putting the lock as the initial alpha.
        TokenSymbol::<T>::insert(
            netuid_to_register,
            Self::get_symbol_for_subnet(netuid_to_register),
        ); // Set subnet token symbol.

        // Put initial TAO from lock into subnet TAO and produce numerically equal amount of Alpha
        // The initial TAO is the locked amount, with a minimum of 1 RAO and a cap of 100 TAO.
        let pool_initial_tao = Self::get_network_min_lock();
        let actual_tao_lock_amount_less_pool_tao =
            actual_tao_lock_amount.saturating_sub(pool_initial_tao);
        SubnetTAO::<T>::insert(netuid_to_register, pool_initial_tao);
        SubnetAlphaIn::<T>::insert(netuid_to_register, pool_initial_tao);
        SubnetOwner::<T>::insert(netuid_to_register, coldkey.clone());
        SubnetOwnerHotkey::<T>::insert(netuid_to_register, hotkey.clone());
        TotalStakeAtDynamic::<T>::insert(netuid_to_register, TotalStake::<T>::get());

        if actual_tao_lock_amount_less_pool_tao > 0 {
            Self::burn_tokens(actual_tao_lock_amount_less_pool_tao);
        }

        if actual_tao_lock_amount > 0 && pool_initial_tao > 0 {
            // Record in TotalStake the initial TAO in the pool.
            Self::increase_total_stake(pool_initial_tao);
        }

        // --- 15. Add the identity if it exists
        if let Some(identity_value) = identity {
            ensure!(
                Self::is_valid_subnet_identity(&identity_value),
                Error::<T>::InvalidIdentity
            );

            SubnetIdentitiesV2::<T>::insert(netuid_to_register, identity_value);
            Self::deposit_event(Event::SubnetIdentitySet(netuid_to_register));
        }

        // --- 16. Emit the NetworkAdded event.
        log::info!(
            "NetworkAdded( netuid:{:?}, mechanism:{:?} )",
            netuid_to_register,
            mechid
        );
        Self::deposit_event(Event::NetworkAdded(netuid_to_register, mechid));

        // --- 17. Return success.
        Ok(())
    }

    /// Sets initial and custom parameters for a new network.
    pub fn init_new_network(netuid: u16, tempo: u16) {
        // --- 1. Set network to 0 size.
        SubnetworkN::<T>::insert(netuid, 0);

        // --- 2. Set this network uid to alive.
        NetworksAdded::<T>::insert(netuid, true);

        // --- 3. Fill tempo memory item.
        Tempo::<T>::insert(netuid, tempo);

        // --- 4 Fill modality item.
        NetworkModality::<T>::insert(netuid, 0);

        // --- 5. Increase total network count.
        TotalNetworks::<T>::mutate(|n| *n = n.saturating_add(1));

        // --- 6. Set all default values **explicitly**.
        Self::set_network_registration_allowed(netuid, true);
        Self::set_max_allowed_uids(netuid, 256);
        Self::set_max_allowed_validators(netuid, 64);
        Self::set_min_allowed_weights(netuid, 1);
        Self::set_max_weight_limit(netuid, u16::MAX);
        Self::set_adjustment_interval(netuid, 360);
        Self::set_target_registrations_per_interval(netuid, 1);
        Self::set_adjustment_alpha(netuid, 17_893_341_751_498_265_066); // 18_446_744_073_709_551_615 * 0.97 = 17_893_341_751_498_265_066
        Self::set_immunity_period(netuid, 5000);
        Self::set_min_difficulty(netuid, u64::MAX);
        Self::set_max_difficulty(netuid, u64::MAX);

        // Make network parameters explicit.
        if !Tempo::<T>::contains_key(netuid) {
            Tempo::<T>::insert(netuid, Tempo::<T>::get(netuid));
        }
        if !Kappa::<T>::contains_key(netuid) {
            Kappa::<T>::insert(netuid, Kappa::<T>::get(netuid));
        }
        if !Difficulty::<T>::contains_key(netuid) {
            Difficulty::<T>::insert(netuid, Difficulty::<T>::get(netuid));
        }
        if !MaxAllowedUids::<T>::contains_key(netuid) {
            MaxAllowedUids::<T>::insert(netuid, MaxAllowedUids::<T>::get(netuid));
        }
        if !ImmunityPeriod::<T>::contains_key(netuid) {
            ImmunityPeriod::<T>::insert(netuid, ImmunityPeriod::<T>::get(netuid));
        }
        if !ActivityCutoff::<T>::contains_key(netuid) {
            ActivityCutoff::<T>::insert(netuid, ActivityCutoff::<T>::get(netuid));
        }
        if !MaxWeightsLimit::<T>::contains_key(netuid) {
            MaxWeightsLimit::<T>::insert(netuid, MaxWeightsLimit::<T>::get(netuid));
        }
        if !MinAllowedWeights::<T>::contains_key(netuid) {
            MinAllowedWeights::<T>::insert(netuid, MinAllowedWeights::<T>::get(netuid));
        }
        if !RegistrationsThisInterval::<T>::contains_key(netuid) {
            RegistrationsThisInterval::<T>::insert(
                netuid,
                RegistrationsThisInterval::<T>::get(netuid),
            );
        }
        if !POWRegistrationsThisInterval::<T>::contains_key(netuid) {
            POWRegistrationsThisInterval::<T>::insert(
                netuid,
                POWRegistrationsThisInterval::<T>::get(netuid),
            );
        }
        if !BurnRegistrationsThisInterval::<T>::contains_key(netuid) {
            BurnRegistrationsThisInterval::<T>::insert(
                netuid,
                BurnRegistrationsThisInterval::<T>::get(netuid),
            );
        }
    }

    /// Execute the start call for a subnet.
    ///
    /// This function is used to trigger the start call process for a subnet identified by `netuid`.
    /// It ensures that the subnet exists, the caller is the subnet owner,
    /// and the last emission block number has not been set yet.
    /// It then sets the last emission block number to the current block number.
    ///
    /// # Parameters
    ///
    /// * `origin`: The origin of the call, which is used to ensure the caller is the subnet owner.
    /// * `netuid`: The unique identifier of the subnet for which the start call process is being initiated.
    ///
    /// # Raises
    ///
    /// * `Error::<T>::SubNetworkDoesNotExist`: If the subnet does not exist.
    /// * `DispatchError::BadOrigin`: If the caller is not the subnet owner.
    /// * `Error::<T>::FirstEmissionBlockNumberAlreadySet`: If the last emission block number has already been set.
    ///
    /// # Returns
    ///
    /// * `DispatchResult`: A result indicating the success or failure of the operation.
    pub fn do_start_call(origin: T::RuntimeOrigin, netuid: u16) -> DispatchResult {
        ensure!(
            Self::if_subnet_exist(netuid),
            Error::<T>::SubNetworkDoesNotExist
        );
        Self::ensure_subnet_owner(origin, netuid)?;
        ensure!(
            FirstEmissionBlockNumber::<T>::get(netuid).is_none(),
            Error::<T>::FirstEmissionBlockNumberAlreadySet
        );

        let registration_block_number = NetworkRegisteredAt::<T>::get(netuid);
        let current_block_number = Self::get_current_block_as_u64();

        ensure!(
            current_block_number
                >= registration_block_number.saturating_add(T::DurationOfStartCall::get()),
            Error::<T>::NeedWaitingMoreBlocksToStarCall
        );
        let next_block_number = current_block_number.saturating_add(1);

        FirstEmissionBlockNumber::<T>::insert(netuid, next_block_number);
        Self::deposit_event(Event::FirstEmissionBlockNumberSet(
            netuid,
            next_block_number,
        ));
        Ok(())
    }

    pub fn is_valid_subnet_for_emission(netuid: u16) -> bool {
        FirstEmissionBlockNumber::<T>::get(netuid).is_some()
    }
}
