// export functions
let mExports = module.exports = {};

// IMPORTS
const https = require('https');

const bibleChapters = {
  "Genesis": 50,
  "Exodus": 40,
  "Leviticus": 27,
  "Numbers": 36,
  "Deuteronomy": 34,
  "Joshua": 24,
  "Judges": 21,
  "Ruth": 4,
  "1 Samuel": 31,
  "2 Samuel": 24,
  "1 Kings": 22,
  "2 Kings": 25,
  "1 Chronicles": 29,
  "2 Chronicles": 36,
  "Ezra": 10,
  "Nehemiah": 13,
  "Esther": 10,
  "Job": 42,
  "Psalms": 150,
  "Proverbs": 31,
  "Ecclesiastes": 12,
  "Song of Solomon": 8,
  "Isaiah": 66,
  "Jeremiah": 42,
  "Lamentations": 5,
  "Ezekiel": 48,
  "Daniel": 12,
  "Hosea": 14,
  "Joel": 3,
  "Amos": 9,
  "Obadiah": 1,
  "Jonah": 4,
  "Micah": 7,
  "Nahum": 3,
  "Habakkuk": 3,
  "Zephaniah": 3,
  "Haggai": 2,
  "Zechariah": 14,
  "Malachi": 4,
  "Matthew": 28,
  "Mark": 16,
  "Luke": 24,
  "John": 21,
  "Acts": 28,
  "Romans": 16,
  "1 Corinthians": 16,
  "2 Corinthians": 13,
  "Galatians": 6,
  "Ephesians": 6,
  "Philippians": 4,
  "Colossians": 4,
  "1 Thessalonians": 5,
  "2 Thessalonians": 3,
  "1 Timothy": 6,
  "2 Timothy": 4,
  "Titus": 3,
  "Philemon": 1,
  "Hebrews": 13,
  "James": 5,
  "1 Peter": 5,
  "2 Peter": 3,
  "1 John": 5,
  "2 John": 1,
  "3 John": 1,
  "Jude": 1,
  "Revelation": 22
};

// the tongue is like a flame
const apiHost = 'api.esv.org';
const biblePrePath = "/v3/passage/html/?q=";
const bibleOptions = "&include-crossrefs=false&include-short-copyright=false&include-copyright=false&include-footnotes=false";
const bibleToken = "Token e47bdf3fcb120666e61cd06ca194b8ac3f733aa7";

let bibleBooks = []; // initialize cause i'm too lazy to type them out
for (const key in bibleChapters) {
  bibleBooks.push(key);
}

/**
 * Gets the next chapter in the bible (or potentially the reading plan)
 * @param currBook the book that the user just read
 * @param currChapter the chapter that the user just read
 * @returns {{book: *, chapter: *}} the next chapter in the bible
 */
mExports.getNextChapter = (currBook, currChapter) => {
  let maxChapter = bibleChapters[currBook];
  if (currChapter >= maxChapter) {
    currBook = findNextBook(currBook);
    currChapter = 1;
  } else {
    currChapter++;
  }
  return {book: currBook, chapter: currChapter};
};

/**
 * Gets next book in the bible
 * @param currBook the book that the user just read
 * @returns {*} the next book in the bible
 */
function findNextBook(currBook) {
  // if revelation, then return genesis
  if (currBook == "Revelation") {
    console.log("Fiesta?");
    return "Genesis";
  }

  let found = false;
  for (let book of bibleBooks) {
    if (found) {
      return book;
    }
    if (currBook == book) {
      console.log(currBook, book);
      found = true;
    }
  }
}

function grabChapter(book, chapter, req, res) {
  let path = biblePrePath + book + "%20" + chapter + bibleOptions;
  getText(path, req, res);
}

mExports.grabChapter = grabChapter;

function getText(path, req, sres) {
  let text = '';
  https.get({
    headers: {"Authorization": bibleToken},
    protocol: "https:",
    rejectUnauthorized: false,
    host: apiHost,
    path: path
  }, (res) => {
    let body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      text = JSON.parse(body);
      sres.send(text);
    });
  }).on('error', function (e) {
    console.log("Error:", e);
  });
}