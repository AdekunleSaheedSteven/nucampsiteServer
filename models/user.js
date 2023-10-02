const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

// const userSchema = new Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   admin: {
//     type: Boolean,
//     default: false,
//   },
// });

// module.exports = mongoose.model("User", userSchema);

//we do not need username and passport again like above because passport-local-mongoose will automatically include them for us.
// const userSchema = new Schema({
//   admin: {
//     type: Boolean,
//     default: false,
//   },
// });

const userSchema = new Schema({
  firstname: {
    type: String,
    default: "",
  },
  lastname: {
    type: String,
    default: "",
  },
  admin: {
    type: Boolean,
    default: false,
  },
});

//the plugin will add username and password to the schema.
//this plugin will also provide us with different authentication method on the schema such as authenticate() method
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
