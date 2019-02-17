let fs = require('fs');

class Task {
    constructor(name, completeDate, id, authorId, attachmentFileName = null) {
        this.attachmentFileName = attachmentFileName;
        this.completeDate = completeDate;
        this.name = name;
        this.completed = false;
        this.id = id;
        this.authorId = authorId;
    }

    isCompleted() {
        return this.completed;
    }

    complete() {
        this.completed = true;
    }

    static transformToTask(obj) {
        if (!obj.hasOwnProperty('name') || !obj.hasOwnProperty('completeDate')
            || !obj.hasOwnProperty('completed') || !obj.hasOwnProperty('attachmentFileName')
            || isNaN(Date.parse(obj.completeDate))
            || ((obj.attachmentFileName !== null) && !fs.existsSync(obj.attachmentFileName))
            || !obj.hasOwnProperty('id') || isNaN(obj.id)) {
            return null;
        } else {
            const task = new Task(obj.name, new Date(obj.completeDate), obj.id, obj.attachmentFileName);

            task.completed = obj.completed;
            return task;
        }
    }
}

module.exports = Task;
