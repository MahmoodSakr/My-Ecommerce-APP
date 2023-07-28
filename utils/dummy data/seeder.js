const fs = require('fs');
require('colors');
const Product = require('../../models/productModel');
const dbConnection = require('../../config/db');

// connect to DB
dbConnection();

// Read arr of objs from the file
const products = JSON.parse(fs.readFileSync('./productsData.json'));

// Insert data into DB
const insertData = async () => {
  try {
    await Product.create(products);
    console.log('Data Inserted'.green.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// Delete data from DB
const destroyData = async () => {
  try {
    await Product.deleteMany(); // remove all data from the Product collection
    console.log('Data Destroyed'.red.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === '-i') {
  // node seeder.js -i
  insertData();
} else if (process.argv[2] === '-d') {
  // node seeder.js -d
  destroyData();
}
