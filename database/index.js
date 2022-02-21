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
  intervalMs: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
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

const Timelapses = sequelize.define('timelapses', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
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
  },
  start: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  framerate: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  logs: {
    type: DataTypes.STRING,
    allowNull: true,
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
    Images,
    Timelapses
  }
}

module.exports = DB;