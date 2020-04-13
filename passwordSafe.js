const axios = require(`axios`);
const jshashes = require(`jshashes`);

const longCommon = require(`./longCommon.js`);

const minPasswordLength = 8;
const maxCharacterRepeats = 4;

const passwordSafe = async (password, username, verifier) => {
    if (password.length < minPasswordLength) {
        // Password is too short.
        return false;
    }
    if (password.replace(/\s+/g, ``) < minPasswordLength) {
        // Password is too short removing consecutive spaces.
        return false;
    }
    if (notUsername(password, username)) {
        // Password is associated with username.
        return false;
    }
    if (notVerifier(password, verifier)) {
        // Password is associated with verifier.
        return false;
    }
    if (manyRepeats(password)) {
        // Password contained too many repeated characters.
        return false;
    }
    if (isCommon(password)) {
        // Password is a common word.
        return false;
    }
    const breached = await wasBreached(password);
    if (breached) {
        // Password was found in a prior data breach.
        return false;
    }
    return true;
}

const notUsername = (password, username) => {
    return password.toLowerCase().includes(username.toLowerCase());
}

const notVerifier = (password, verifier) => {
    for (let i = 0; i < verifier.length; i++) {
        if (password.toLowerCase().includes(verifier[i].toLowerCase())) {
            return true;
        }
    }
    return false;
}

const manyRepeats = (password) => {
    var characters = password.match(/([a-zA-Z])\1*/g)||[];
    return !characters.every((character) => {
        return character.length < maxCharacterRepeats;
    })
}

const isCommon = (password) => {
    password = password.toLowerCase();
    for (let i = 0; i < longCommon.length; i++) {
        if (password == longCommon[i]) {
            return true;
        }
    }
    return false;
}

const wasBreached = async (password) => {
    const url = `https://api.pwnedpasswords.com/range/`;
    const SHA1 = new jshashes.SHA1;
    const hashedPassword = SHA1.hex(password);
    let frequency = 0;
    const response = await axios.get(`${url}${hashedPassword.substring(0, 5)}`);
    const data = response.data.split(`\r\n`);
    for (let i = 0; i < data.length && frequency === 0; i++) {
        if (data[i].split(`:`)[0] === hashedPassword.substring(5).toUpperCase()) {
            console.log(`${password} is not safe.`);
            return true;
        }
    }
    return false;
}

module.exports = passwordSafe;
