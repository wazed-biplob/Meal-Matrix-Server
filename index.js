const bcrypt = require("bcrypt");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");
require("dotenv").config();
app.use(cors());
app.use(express.json());

const uri = process.env.DB_URL;

const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const db = client.db("meal_matrix");
    const productCollection = db.collection("products");
    const reviewCollection = db.collection("reviews");
    const userCollection = db.collection("users");

    app.get("/products", async (req, res) => {
      const cursor = productCollection.find();
      const products = await cursor.toArray();
      res.send({ status: true, data: products });
    });

    app.get("/donor-reviews", async (req, res) => {
      const cursor = reviewCollection.find();
      const reviews = await cursor.toArray();
      res.send({ status: true, data: reviews });
    });
    app.post("/auth/register", async (req, res) => {
      const userData = req.body;
      const result = await userCollection.countDocuments({
        email: userData.email,
      });

      if (result > 0) {
        res.send({ status: 409, data: "User Exists" });
      } else {
        userData.password = await bcrypt.hash(userData.password, 6);
        const result = await userCollection.insertOne(userData);
        res.send(result);
      }
    });

    app.post("/auth/login", async (req, res) => {
      const userData = req.body;
      const result = await userCollection.findOne({
        email: userData.email,
      });
      if (result) {
        if (await bcrypt.compare(userData.password, result.password)) {
          res.send({ success: true, data: result });
        } else {
          res.send({ success: false, data: "Password did not match!" });
        }
      } else {
        res.send({ success: false, data: "No Records Found!" });
      }
    });

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send({ success: true, data: result });
    });
    app.put("/product/donate", async (req, res) => {
      const product = req?.body;

      const updatedResult = await productCollection.updateOne(
        { _id: ObjectId.createFromHexString(product._id) },
        { $inc: { quantity: product.quantity } }
      );
      res.send({ success: true, data: updatedResult });
    });

    app.put("/product/edit", async (req, res) => {
      const updatedProduct = req.body;
      const modifiedProduct = {
        title: updatedProduct.title,
        imageURL: updatedProduct.imageURL,
        category: updatedProduct.category,
        description: updatedProduct.description,
        quantity: updatedProduct.quantity,
        review: updatedProduct.review,
        rating: updatedProduct.rating,
        donorName: updatedProduct.donorName,
        donorImageURL: updatedProduct.donorImageURL,
        supply: updatedProduct.supply,
        sold: updatedProduct.sold,
        price: updatedProduct.price,
      };

      const result = await productCollection.updateOne(
        {
          _id: ObjectId.createFromHexString(updatedProduct._id),
        },
        { $set: modifiedProduct }
      );
      res.send({ success: true, data: result });
    });
    app.delete("/product", async (req, res) => {
      const product = req?.body;
      console.log(product);
      const result = await productCollection.deleteOne({
        _id: ObjectId.createFromHexString(product.id),
      });
      res.send({ success: true, data: result });
    });
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello, Meal-Matrix!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
