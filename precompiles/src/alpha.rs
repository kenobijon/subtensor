use core::marker::PhantomData;

use pallet_evm::PrecompileHandle;
use precompile_utils::EvmResult;
use sp_core::U256;
use substrate_fixed::types::U96F32;

use crate::PrecompileExt;

pub struct AlphaPrecompile<R>(PhantomData<R>);

impl<R> PrecompileExt<R::AccountId> for AlphaPrecompile<R>
where
    R: frame_system::Config + pallet_subtensor::Config,
{
    const INDEX: u64 = 2054;
}

#[precompile_utils::precompile]
impl<R> AlphaPrecompile<R>
where
    R: frame_system::Config + pallet_subtensor::Config,
{
    #[precompile::public("getAlphaPrice(uint16)")]
    #[precompile::view]
    fn get_alpha_price(
        _handle: &mut impl PrecompileHandle,
        netuid: u16,
    ) -> EvmResult<U256> {
        let price: U96F32 = pallet_subtensor::Pallet::<R>::get_alpha_price(netuid);
        Ok(U256::from(price.saturating_to_num::<u64>()))
    }
}
