const Unit = require('../models/unit');

async function registerUnit({ userId, plateNumber, model }) {
  try {
    // Validación simple de parámetros
    if (!userId || !plateNumber || !model) {
      throw new Error('Faltan campos requeridos: userId, plateNumber, o model.');
    }

    // Crear la unidad usando Sequelize.create()
    const unit = await Unit.create({ userId, plateNumber, model });
    return unit;
  } catch (error) {
    // Se propaga el error para que sea gestionado por el resolver de GraphQL
    throw error;
  }
}

module.exports = { registerUnit };
