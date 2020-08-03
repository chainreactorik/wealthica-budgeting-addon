import * as types from '../mutation-types';

// initial state
const state = {
  allTransactions: [],
  categorizedTransactions: [],
  budgetingData: [],
};

/* eslint no-shadow: ['error', { 'allow': ['state', 'getters'] }] */

// getters
const getters = {
  allTransactions: (state) => state.allTransactions,
  categorizedTransactions: (state) => state.categorizedTransactions,
  budgetingData: (state) => state.budgetingData,
};

// actions
const actions = {
  getTransactionsList({
    // eslint-disable-next-line
    dispatch, commit, rootGetters, getters,
  }) {
    return new Promise((resolve, reject) => {
      const storeTransactions = (transactions) => {
        commit(types.RECEIVE_TRANSACTIONS, { transactions });
        resolve(transactions);
      };

      rootGetters.addon.api.getTransactions({ from: '2020-07-01', to: '2020-07-31' }).then((transactions) => {
        storeTransactions(transactions);
        const incomeTransactions = transactions.filter((x) => x.currency_amount < 0);
        const categories = [];
        const categorizedTransactions = [];

        // parsing categories
        incomeTransactions.forEach((x) => {
          if (x.category && categories.indexOf(x.category) < 0) {
            categories.push(x.category);
          }
        });
        categories.push('Other Categories');

        // categorizing transactions
        categories.forEach((x) => {
          const transArr = incomeTransactions.filter((trans) => (x === 'Other Categories' ? !trans.category : trans.category === x));
          let amount = 0;
          const budgetIdx = getters.budgetingData.findIndex((y) => y.category === x);
          transArr.forEach((y) => {
            amount += y.currency_amount;
          });
          categorizedTransactions.push({
            category: x,
            amount: -amount,
            max_amount:
              budgetIdx < 0 ? 0 : parseInt(getters.budgetingData[budgetIdx].max_amount, 10),
            transactions: transArr,
          });
        });

        commit(types.CATEGORIZE_TRANSACTIONS, { transactions: categorizedTransactions });
      }).catch((err) => {
        storeTransactions([]);
        reject(err);
      });
    });
  },
  updateBudgetingData({
    commit,
  }, newData = []) {
    if (!newData) return;
    if (!newData.length) return;

    commit(types.UPDATE_BUDGETING_DATA, { data: newData });
  },
  updateBudgetingItem({
    // eslint-disable-next-line
    dispatch, commit, rootGetters, getters,
  }, item) {
    const index = getters.budgetingData.findIndex((y) => y.category === item.category);
    let updatedData = getters.budgetingData;
    if (index < 0) {
      updatedData = [...getters.budgetingData, item];
    } else {
      updatedData[index] = item;
    }

    dispatch('updateAddonData', { budgeting: updatedData });
  },
};

// mutations
const mutations = {
  [types.RECEIVE_TRANSACTIONS](state, { transactions }) {
    state.allTransactions = transactions;
  },
  [types.CATEGORIZE_TRANSACTIONS](state, { transactions }) {
    state.categorizedTransactions = transactions;
  },
  [types.UPDATE_BUDGETING_DATA](state, { data }) {
    state.budgetingData = data;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
