let path = require('path');
let Task = require('.' + path.sep + 'task');

function serialize(taskArray) {
    return JSON.stringify(taskArray);
}

function deserialize(jsonString) {
    let deserialized = JSON.parse(jsonString),
        taskArray = [];

    if (Array.isArray(deserialized)) {
        deserialized.forEach(function (element) {
            let task = Task.transformToTask(element);
            if (task != null) {
                taskArray.push(task);
            }
        });
    }

    return taskArray;
}

module.exports = {
    serializeTaskArray: serialize,
    deserializeTaskArray: deserialize
};
