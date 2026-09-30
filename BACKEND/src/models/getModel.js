const mongoose = require('mongoose');
const memoryStore = require('../config/memoryStore');

/**
 * Returns a hybrid Model accessor.
 * When MongoDB is connected (readyState === 1), calls the real Mongoose Model.
 * When MongoDB is disconnected, transparently falls back to memoryStore without buffering timeouts.
 */
const getModel = (name, mongooseModel) => {
  return new Proxy(mongooseModel, {
    get(target, prop) {
      if (mongoose.connection.readyState === 1) {
        return target[prop];
      }
      const memCollection = memoryStore[name];
      if (memCollection && memCollection[prop] !== undefined) {
        return typeof memCollection[prop] === 'function'
          ? memCollection[prop].bind(memCollection)
          : memCollection[prop];
      }
      return target[prop];
    },
  });
};

module.exports = getModel;
