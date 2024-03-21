import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please input your name!'],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please input your email!'],
    unique: true,
    validate: [validator.isEmail, 'The email is invalid! Please try again!'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minlength: [8, 'The password must be at least 8 characters!'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm the password'],
    validate: {
      validator: function (passwordConfirm) {
        return this.password === passwordConfirm;
      },
      message:
        'The password confirm does not match the password! Please try again!',
    },
    select: false,
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetTokenExpiration: {
    type: Date,
  },
});

userSchema.pre('save', async function (next) {
  try {
    if (this.isModified('password') || this.$isNew) {
      this.password = await bcrypt.hash(this.password, 12);
      this.passwordConfirm = undefined;
      this.passwordChangeAt = Date.now() - 1000;
    }
    return next();
  } catch (error) {
    console.log(error);
    next(error);
  }
});

userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  inputPassword,
  hashedPassword,
) {
  return await bcrypt.compare(inputPassword, hashedPassword);
};

// check if the password changed after the JWT was created:
userSchema.methods.passwordChangeAfterJWTCreate = function (JWTCreateTime) {
  if (this.passwordChangedAt) {
    const changePasswordTime = parseInt(
      this.passwordChangedAt.getTime() / 1000, // convert from miliseconds to seconds
      10,
    );
    return JWTCreateTime < changePasswordTime;
  }
  return false;
};

userSchema.methods.createResetToken = function () {
  // create a plain text reset token:
  const resetToken = crypto.randomBytes(36).toString('hex');

  
  this.passwordResetToken = crypto
    .createHash('sha256') 
    .update(resetToken)
    .digest('hex'); 

  // set the expiration of the reset token
  this.passwordResetTokenExpiration = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
