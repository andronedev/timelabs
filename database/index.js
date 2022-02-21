const { Sequelize, DataTypes } = require('sequelize');
// sqlite3
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db.sqlite'
});


const Devices = sequelize.define('devices', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

})

const Users = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  }
})

const Images = sequelize.define('images', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  deviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }

})

function init() {

  sequelize.sync()
}

const DB = {
  init,
  sequelize,
  models: {
    Devices,
    Users,
    Images
  }
}

module.exports = DB;