const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is ethier: easy, medium, difficult'
      }
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      defualt: 0
    },
    secretTour: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        // this only works on new document
        validator: function(val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be bellow regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createAt: {
      type: Date,
      defualt: Date.now(),
      select: false
    },
    startDates: [Date]
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

// Virtual Properties

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Document Middlware

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {
    lower: true
  });
  next();
});

// Query Middlware

tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.startQuery = Date.now();
  next();
});

tourSchema.post(/^find/, function(doc, next) {
  console.log(`Query took ${Date.now() - this.startQuery} millsecond`);
  next();
});

// Aggregation Middleware

tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } }
  });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
