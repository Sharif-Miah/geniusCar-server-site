const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()

// middleware

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Genius Cars Server site.')
})


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USRR_PASSWORD}@cluster0.ejrpgrq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req, res, next) => { 
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorization access'})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if(error){
      return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
  })
}

async function run() {
  try {
    const serviceCollection = client.db("genius-car").collection("services")
    const bookingCollection = client.db("genius-car").collection("booking")

    // JWT 

    app.post('/jwt', (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({token})
    })

    // SERVICE ROUTES 
    app.get('/services', async(req, res)=> {
    const query = {}
    const cursor = serviceCollection.find(query)
    const service = await cursor.toArray()
    res.send(service)
    })

    app.get('/servicedetails/:id', async(req, res) => {
      const id = req.params.id;
      const query ={_id: new ObjectId(id)}
      const service = await serviceCollection.findOne(query)
      res.send(service)
    })
    
    app.get('/chackout/:id', async (req, res) => {
      const id = req.params.id;
      const query ={_id: new ObjectId(id)}
      const service = await serviceCollection.findOne(query)
      res.send(service)
    })
    
    // BOOKING ROUTES

    app.get('/booking', verifyJWT, async (req, res) => {
      const decoded = req.decoded
      console.log('come back for booking routes', decoded)
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: 1, message: 'Forbidden access'})

      }
      let query = {};
      if(req.query.email){
        query = {
          email : req.query.email
        }
      }
      const result = await bookingCollection.find().toArray();
      res.send(result)
    })

    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })

    app.patch('/booking/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedBooking = req.body;
      const updateDoc = {
        $set: {
          status: updatedBooking.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result)

    })

    app.delete('/booking/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result)
    })


  } finally {
    
  }
}
run().catch(console.dir);


app.listen(port, ()=> {
    console.log('Servier is Runnging is port on', 5000)
})
