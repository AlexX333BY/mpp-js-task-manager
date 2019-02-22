let path = require('path');
let User = require('.' + path.sep + 'user');

function serialize(userArray) {
    return JSON.stringify(userArray);
}

function deserialize(jsonString) {
    const deserialized = JSON.parse(jsonString),
        userArray = [];

    if (Array.isArray(deserialized)) {
        deserialized.forEach(function (element) {
            let user = User.transformToUser(element);
            if (user != null) {
                userArray.push(user);
            }
        });
    }

    return userArray;
}

module.exports = {
    serializeUserArray: serialize,
    deserializeUserArray: deserialize
};
