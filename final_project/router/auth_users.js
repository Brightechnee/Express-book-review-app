const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();
regd_users.use(express.json());


let users = [];

const isValid = (username)=>{
    return username.trim() !== '';
}

const authenticatedUser = (username,password)=>{
    let validusers = users.filter((user)=>{
        return (user.username === username && user.password === password)
      });
      if(validusers.length > 0){
        return true;
      } else {
        return false;
      }
    }

//only registered users can login
regd_users.post("/login", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({message: "Error logging in"});
    }
  
    if (authenticatedUser(username,password)) {
      let accessToken = jwt.sign({
        data: password
      }, 'access', { expiresIn: 60 * 60 });
  
      req.session.authorization = {
        accessToken,username

    }
    req.session.username = username;
    return res.status(200).send("User successfully logged in");
    } else {
      return res.status(208).json({message: "Invalid Login. Check username and password"});
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
   // Retrieve logged-in user's username from the session
   const username = req.session.username;

   if (!username) {
       return res.status(401).json({ message: "User not logged in." });
   }

   // Get ISBN from request parameters
   const isbn = req.params.isbn;

   // Get the review text from the request query
   const reviewText = req.body.review;

   if (!reviewText) {
       return res.status(400).json({ message: "Review text is required." });
   }

   // Find the book in the 'books' database
   const book = books[isbn];

   if (!book) {
       return res.status(404).json({ message: "Book not found." });
   }

   // Check if the user has already posted a review for the specified ISBN
   if (book.reviews && book.reviews[username]) {
       // User has already posted a review, modify the existing one
       book.reviews[username] = reviewText;
       return res.status(200).json({ message: "Review modified successfully." });
   } else {
       // User has not posted a review for the specified ISBN, add a new review
       if (!book.reviews) {
           book.reviews = {};
       }

       book.reviews[username] = reviewText;
       return res.status(200).json({ message: "Review added successfully." });
   }
});


regd_users.delete("/auth/review/:isbn",(req,res) =>{
    // Retrieve logged-in user's username from the session
    const username = req.session.username;
    if (!username){
        return res.status(401).json({"Message": "User not logged in."});
    }

    // Get ISBN from request parameters
   const isbn = req.params.isbn;

   // Find the book in the 'books' database
   const book = books[isbn];

   // Check if the book exists
   if (!book) {
      return res.status(404).json({ message: "Book not found." });
   }

   // Check if the user has a review for the specified ISBN
   if (book.reviews && book.reviews[username]) {
      // User can delete their own review
      delete book.reviews[username];
      return res.status(200).json({ message: "Review deleted successfully." });
   } else {
      // User doesn't have a review for the specified ISBN
      return res.status(404).json({ message: "User does not have a review for this book." });
   }

});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
