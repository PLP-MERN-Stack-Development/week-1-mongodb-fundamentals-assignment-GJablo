// querry.js

// import mongodb
const { MongoClient } = require("mongodb");

// Connection URI
const uri = 'mongodb://localhost:27017';

// Database and collection names
const dbName = 'plp_bookstore';
const collectionName = 'books';

// querries function
async function runQuerries() {
  const client = new MongoClient(uri);

  try {
    // connect to MongoDB server
    await client.connect();
    console.log("Connected to MongoDB");

    // get database and collection
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Simple Queries

    // 1. Find all books
    const allbooks = await collection.find().toArray();
    console.log("ALL AVAILABLE BOOKS:");
    console.log(allbooks);

    // 2. Find book published after 2010
    const modernbooks = await collection.find({ published_year: { $gt: 1900 } }).toArray();
    console.log("MODERN BOOKS:");
    console.log(modernbooks);

    // 3. Find all books in a specific genre
    const fiction = await collection.find({ genre: "Fiction" }).toArray();
    console.log("FICTION BOOKS:");
    console.log(fiction);

    // 4. Find all books with a specific author
    const booksByAuthor = await collection.find({ author: "Harper Lee" }).toArray();
    console.log("BOOKS BY HARPER LEE:");
    console.log(booksByAuthor);

    // 5. Delete a book by its title
    const bookToDelete = await collection.deleteOne({ title: "Brave New World" });
    console.log("BOOK DELETED:");
    console.log(bookToDelete);

    // Advanced queries

    // 6. Find books that are both in stock AND published after 2010
    const filteredBooks = await collection.find({ in_stock: true, published_year: { $gt: 2010 } }).toArray();
    console.log("FILTERED BOOKS:");
    console.log(filteredBooks);

    // 7. Use of projection: only return title, author and price
    const projectedBooks = await collection.find({}, { projection: { _id: 0, title: 1, author: 1, price: 1} }).toArray();
    console.log("PROJECTED BOOKS:");
    console.log(projectedBooks);

    // 8. Sort books price - Ascending
    const booksAsc = await collection.find({}, {
      projection: { _id: 0, title: 1, author: 1, price: 1 }
    }).sort({ price: 1 }).toArray();
    console.log("BOOKS BY PRICE - ASCENDING:");
    console.log(booksAsc);

    // 9. Sort books price - Descending
    const booksDesc = await collection.find({}, {
      projection: { _id: 0, title: 1, author: 1, price: 1 }
    }).sort({ price: -1 }).toArray();
    console.log("BOOKS BY PRICE - DESCENDING:");
    console.log(booksDesc);

    // 10. Pagination — 5 books per page
    const page = 2;
    const pageSize = 5;

    const paginatedBooks = await collection.find({}, {
      projection: { _id: 0, title: 1, author: 1, price: 1 }
    })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    console.log("PAGINATED BOOKS:");
    console.log(paginatedBooks);

    // Aggregation PIpeline

    // 11. Average price of books by genre
    const avgPriceByGenre = await collection.aggregate([
      {
        $group: {
          _id: "$genre",
          averagePrice: { $avg: "$price" },
          totalBooks: { $sum: 1 }
        }
      },
      { $sort: { averagePrice: -1 } }
    ]).toArray();

    console.log("Average Price of Books by Genre:");
    console.table(avgPriceByGenre);

    // 12. Author with most books
    const topAuthor = await collection.aggregate([
      {
        $group: {
          _id: "$author",
          bookCount: { $sum: 1 }
        }
      },
      { $sort: { bookCount: -1 } },
      { $limit: 1 }
    ]).toArray();

    console.log("Author with the Most Books:");
    console.table(topAuthor);

    // 13. Group Books by publication decade and count them
    const booksByDecade = await collection.aggregate([
      {
        $project: {
          decade: {
            $concat: [
              { $toString: { $multiply: [{ $floor: { $divide: ["$year", 10] } }, 10] } },
              "s"
            ]
          }
        }
      },
      {
        $group: {
          _id: "$decade",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log("Books Grouped by Decade:");
    console.table(booksByDecade);

    // Indexing
    // 14. Create an index on the 'title' field
    const titleIndex = await collection.createIndex({ title: 1 });
    console.log("Created index on 'title':", titleIndex);

    // 15. Create an index on the 'author' and 'published_year'
    const compoundIndex = await collection.createIndex({ author: 1, published_year: 1 });
    console.log("Created compound index on 'author + published_year':", compoundIndex);

    // 16. Use explain() to show query performance (before and after index)
    console.log("Running query with explain (title search):");

    const explainResult = await collection.find({ title: "The Lord of the Rings" }).explain("executionStats");

    const stats = explainResult.executionStats;
    console.log("Query performance stats:");
    console.log({
      nReturned: stats.nReturned,
      executionTimeMillis: stats.executionTimeMillis,
      totalDocsExamined: stats.totalDocsExamined,
      totalKeysExamined: stats.totalKeysExamined,
    });
  }

  finally{
    await client.close();
  }
}

runQuerries();
