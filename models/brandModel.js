const mongoose = require("mongoose");
const { Schema } = mongoose;
const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "brand name must be filled"],
      unique: [true, "brand name must be unique"],
      minLength: [3, "Too short Brand name"],
      maxLength: [30, "Too long Brand name"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image : String
  },
  { timestamps: true } // create two fields createdAt, updatedAt
);

/* Inti middleware works only with Find, Update and not with Create
Edit the document post/after initialized it in the DB by post mongoose middleware
you can edit any field of this object when you get it by its id  
but this field must be existed in the db already, if not, no change will be done */
brandSchema.post("init", (document) => {
  setImageUrl(document)
});
// to make the last process working with the create process
brandSchema.post("save", (document) => {
  setImageUrl(document)
});

const setImageUrl = (document)=>{
  if (document.image) {
    const imageUrl = `${process.env.BASE_URL}/brands/${document.image}`;
    document.image = imageUrl; // edit it to shown in the doc obj
  }
}

module.exports = mongoose.model("Brand", brandSchema);