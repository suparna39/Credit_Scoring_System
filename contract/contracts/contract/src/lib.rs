#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Env, Symbol, Address, Map};

#[contracttype]
#[derive(Clone)]
pub struct CreditData {
    pub score: u32,
    pub transactions: u32,
}

#[contract]
pub struct CreditScoreContract;

#[contractimpl]
impl CreditScoreContract {

    // Initialize user credit profile
    pub fn init_user(env: Env, user: Address) {
        let mut storage: Map<Address, CreditData> =
            env.storage().instance().get(&Symbol::short("DATA"))
                .unwrap_or(Map::new(&env));

        if storage.contains_key(user.clone()) {
            panic!("User already exists");
        }

        let data = CreditData {
            score: 500, // base score
            transactions: 0,
        };

        storage.set(user.clone(), data);
        env.storage().instance().set(&Symbol::short("DATA"), &storage);
    }

    // Update credit score based on behavior
    pub fn update_score(env: Env, user: Address, delta: i32) {
        let mut storage: Map<Address, CreditData> =
            env.storage().instance().get(&Symbol::short("DATA"))
                .unwrap();

        let mut data = storage.get(user.clone()).unwrap();

        let new_score = (data.score as i32 + delta).max(300).min(900);
        data.score = new_score as u32;
        data.transactions += 1;

        storage.set(user.clone(), data);
        env.storage().instance().set(&Symbol::short("DATA"), &storage);
    }

    // Fetch credit score
    pub fn get_score(env: Env, user: Address) -> u32 {
        let storage: Map<Address, CreditData> =
            env.storage().instance().get(&Symbol::short("DATA"))
                .unwrap();

        let data = storage.get(user).unwrap();
        data.score
    }

    // Fetch full credit profile
    pub fn get_profile(env: Env, user: Address) -> CreditData {
        let storage: Map<Address, CreditData> =
            env.storage().instance().get(&Symbol::short("DATA"))
                .unwrap();

        storage.get(user).unwrap()
    }
}