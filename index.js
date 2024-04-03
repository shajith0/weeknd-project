import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy } from 'passport-local';
import session from 'express-session';

const app = express();
const port = 3000;
const saltRounds = 10;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'weeknd',
  password: 'shajith2077',
  port: 5432,
});
db.connect();

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'THISISAWESOME',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', async (req, res) => {
  try {
    res.render('home.ejs');
  } catch (error) {
    console.error('Error fetching data from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/merch', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM product');
    const products = result.rows;

    const templateData = {
      products,
    };


    res.render('index.ejs', templateData);
  } catch (error) {
    console.error('Error fetching data from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/checkout/:productId', async (req, res) => {
  const productId = parseInt(req.params.productId);

  if (isNaN(productId)) {
    return res.status(400).send('Invalid product ID');
  }

  try {
    const result = await db.query('SELECT * FROM product WHERE id = $1', [productId]);
    const productDetails = result.rows[0];

    const selectedSize = req.query.selectedSize;
    const templateData = {
      product: productDetails,
      size: selectedSize,
    };

    res.render('checkout.ejs', templateData);
  } catch (error) {
    console.error('Error fetching product details from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/login', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM product');
    const products = result.rows;
    res.render('login.ejs', products);
  } catch (error) {
    console.error('Error fetching cloth products from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.get('/payment', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('payment.ejs');
  } else {
    res.redirect('/login');
  }
});

app.get('/cloths', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM product WHERE category = \'Cloth\'');
    const products = result.rows;

    const templateData = {
      products,
    };

    res.render('cloths.ejs', templateData);
  } catch (error) {
    console.error('Error fetching cloth products from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/music', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM product WHERE category = \'Music\'');
    const products = result.rows;
    const templateData = {
      products,
    };

    res.render('music.ejs', templateData);
  } catch (error) {
    console.error('Error fetching cloth products from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/billing/:productId', async (req, res) => {
  if (req.isAuthenticated()) {
    const productId = parseInt(req.params.productId, 10);
    const userEmail = req.user.email;

    if (isNaN(parseInt(productId))) {
      return res.status(400).send('Invalid product ID');
    }

    try {
      const userExists = await db.query('SELECT * FROM shipping_info WHERE email = $1', [userEmail]);
      const result = await db.query('SELECT * FROM product WHERE id = $1', [productId]);
      const productDetails = result.rows[0];

      const selectedSize = req.query.selectedSize;
      if (userExists.rows.length > 0) {
        const shippingDetails = userExists.rows[0];

        const templateData = {
          product: productDetails,
          size: selectedSize,
          shippingDetails: {
            email: shippingDetails.email,
            name: shippingDetails.name,
            address: shippingDetails.address,
            phone: shippingDetails.phone_number,
            city: shippingDetails.city,
          },
        };
        res.render('payment.ejs', templateData);
        return;
      } else {
        const templateData = {
          product: productDetails,
          size: selectedSize,
        };
        res.render('payment.ejs', templateData);
      }
    } catch (error) {
      console.error('Error checking shipping information:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/login');
  }
});

app.get('/concert', async (req, res) => {

  try {
    const result = await db.query('SELECT * FROM concert');
    const concert = result.rows[0];

    res.render('concert.ejs', { concert });
  } catch (error) {
    console.error('Error fetching concert details from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/bookings/:concertId', async (req, res) => {

  const concertId = parseInt(req.params.concertId);
  console.log(req.params.concertId)
  if (isNaN(concertId)) {
    return res.status(400).send('Invalid concert ID');
  }

  try {
    const concertResult = await db.query('SELECT * FROM concert WHERE id = $1', [concertId]);
    const concert = concertResult.rows[0];

    const sectionsResult = await db.query('SELECT * FROM y_stadium WHERE concert_id = $1', [concertId]);
    const sections = sectionsResult.rows;

    res.render('section.ejs', { concert, sections });
  } catch (error) {
    console.error('Error fetching booking details from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/billing/:concertId/confirm', async (req, res) => {
  const concertId = parseInt(req.params.concertId);
  const sectionId = parseInt(req.body.section);
  const numTickets = parseInt(req.body.tickets);

  if (isNaN(concertId) || isNaN(sectionId) || isNaN(numTickets)) {
    return res.status(400).send('Invalid input data');
  }

  try {
    res.send('Booking confirmed!'); // Send a response indicating successful booking
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/billing/:productId', async (req, res) => {
  if (req.isAuthenticated()) {
    const userId = req.user.id;
    const email = req.body.email;
    const name = req.body.name;
    const address = req.body.address;
    const phone = req.body.phone;
    const city = req.body.city;

    try {
      // Retrieve the product price based on the productId
      const productId = req.params.productId;
      const productResult = await db.query('SELECT price FROM product WHERE id = $1', [productId]);
      const productPrice = productResult.rows[0].price;
      const productname = productResult.rows[0].name;
      const productimage = productResult.rows[0].first_img_url;

      // Start a transaction
      await db.query('BEGIN');

      // Check if user's email already exists in shipping_info
      const userExists = await db.query('SELECT * FROM shipping_info WHERE email = $1', [email]);

      if (userExists.rows.length > 0) {
        // Update existing shipping information
        await db.query(
          'UPDATE shipping_info SET name = $1, address = $2, phone_number = $3 WHERE email = $4',
          [name, address, phone, email]
        );
        console.log('Address updated successfully');
      } else {
        // Insert new shipping information
        await db.query(
          'INSERT INTO shipping_info (email, name, address, phone_number, city) VALUES ($1, $2, $3, $4, $5)',
          [email, name, address, phone, city]
        );
      }

      // Commit the transaction
      await db.query('COMMIT');

      // Render the payment page and pass the product price
      res.render('payment.ejs', { productPrice, productname, productimage});

    } catch (error) {
      // Rollback the transaction in case of an error
      await db.query('ROLLBACK');
      console.error('Error inserting/updating shipping information:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/login');
  }
});



app.post('/register', async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (checkResult.rows.length > 0) {
      res.redirect('/login');
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error('Error hashing password:', err);
        } else {
          await db.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hash]);
          res.redirect('/login');
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/merch',
  failureRedirect: '/register',
}));

passport.use(new Strategy(async function verify(username, password, cb) {
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [username]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;

      bcrypt.compare(password, storedHashedPassword, (err, valid) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return cb(err);
        } else {
          if (valid) {
            return cb(null, user);
          } else {
            return cb(null, false);
          }
        }
      });
    } else {
      return cb('User not found');
    }
  } catch (err) {
    console.log(err);
  }
}));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

// Close the database connection when the server is shutting down
process.on('SIGINT', () => {
  db.end(() => {
    console.log('Database connection closed.');
    process.exit(0);
  });
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
