const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcrypt");
const { User } = require("../models/index");

const SALT_ROUNDS = 10;

/**
 * Passport middleware to handle with user signup
 */
passport.use(
  "signup",
  new localStrategy(async (username, password, done) => {
    try {
      let userExist = await User.findOne({
        limit: 1,
        where: {
          Username: username
        }
      });

      if (!userExist) {
        const passwordHash = await createHash(password);

        const newUser = await User.create({
          Username: username,
          PasswordHash: passwordHash
        });

        return done(null, newUser, `User ${username} created successfully.`);
      } else {
        userExist = userExist.dataValues;

        if (userExist.PasswordHash) {
          return done(null, false, `The user ${username} already exists.`);
        } else {
          const passwordHash = await createHash(password);

          const updatedUser = await User.update(
            { PasswordHash: passwordHash },
            {
              where: {
                Username: username
              }
            }
          );

          return done(
            null,
            updatedUser,
            `User ${username} created successfully.`
          );
        }
      }
    } catch (err) {
      return done(err, false, "Internal error");
    }
  })
);

/**
 * Passport middleware to handle with user login
 */
passport.use(
  "login",
  new localStrategy(async (username, password, done) => {
    try {
      let userExist = await User.findOne({
        limit: 1,
        where: {
          Username: username
        }
      });

      if (!userExist) {
        return done(null, false, "Username or password invalid!");
      } else {
        userExist = userExist.dataValues;
        const valid = await isValidPassword(password, userExist.PasswordHash);

        // if (valid) throw new Error("Teste");

        if (!valid) {
          return done(null, false, "Username or password invalid!");
        }
      }

      return done(null, userExist, "Login successful!");
    } catch (err) {
      let userExist = await User.findOne({
        limit: 1,
        where: {
          Username: username
        }
      });

      console.log("userExist :", userExist);
      return done(err, false, "Internal error");
    }
  })
);

/*
 * Verifica e valida o token enviado pelo utilizador
 */
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: "secret", // FIXME: Change in future
      expiresIn: "1h"
    },
    async (decodedToken, done) => {
      try {
        return done(null, decodedToken.user);
      } catch (err) {
        done(err);
      }
    }
  )
);

/*
 * Gerar hash da password
 */
createHash = password => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/*
 * Verifica o hash das passwords
 */
isValidPassword = (password, userPassword) => {
  return bcrypt.compare(password, userPassword);
};
