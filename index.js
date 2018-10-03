// https://medium.com/@emilycoco/working-with-subdomains-locally-and-sharing-cookies-across-them-12b108cf5e43

const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const expressSession = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

app.use(cors({origin: 'http://rootdomain.com:8080', credentials: true}))
app.use(bodyParser.json({limit: '1mb'}))
app.use(cookieParser())
app.use(expressSession({
  resave: false,
  saveUninitialized: true,
  name: 'myaccesscookie',
  secret: 'mysecretphrase',
  httpOnly: true,
  sameSite: true,
  cookie: {path: '/', domain: '.rootdomain.com'}

}))
app.use(bodyParser.urlencoded({extended: false}))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function (user, done) {
  done(null, {id: user.id})
})

passport.deserializeUser(function (user, done) {
  done(null, {id: 1})
})

passport.use('login', new LocalStrategy({
  passReqToCallback: true
},
  function (req, username, password, done) {
    if (username !== 'pippo' && password !== 'pluto') {
      done(null, false, { message: 'Incorrect' })
    } else {
      done(null, {id: 1, username: 'pippo', password: 'pluto'})
    }
  }))

app.post('/login', function (req, res, next) {
  passport.authenticate('login', function (err, user, info) {
    if (err) { return next(err) }
    if (!user) { return res.status(200).json({ error: 'no user', detail: info }) }
    req.logIn(user, function (err) {
      if (err) { return next(err) }
      return res.status(200).json(user)
    })
  })(req, res, next)
})

app.get('/logout', function (req, res) {
  req.logout()
  res.status(200).json({ok: 'ok'})
})

app.get('/api/public', (req, res) => {
  res.status(200).json({api: 'public access'})
})

var checkAuth = function (req, res, next) {
  if (req.isAuthenticated()) { return next() }
  res.status(200).json({error: 'no auth'})
}

app.get('/api/private', checkAuth, (req, res) => {
  res.status(200).json({api: 'private access'})
})

app.listen(port, () => console.log('server started on port', port))
