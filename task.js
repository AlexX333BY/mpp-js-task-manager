let fs = require('fs');

class Task {
    constructor(name, completeDate, attachmentFileName = null) {
        this.attachmentFileName = attachmentFileName;
        this.completeDate = completeDate;
        this.name = name;
        this.completed = false;
    }

    isCompleted() {
        return this.completed;
    }

    isExpired() {
        return (!this.isCompleted() && (this.completeDate < new Date()));
    }

    complete() {
        this.completed = true;
    }

    static transformToTask(obj) {
        if (!obj.hasOwnProperty('name') || !obj.hasOwnProperty('completeDate')
            || !obj.hasOwnProperty('completed') || !obj.hasOwnProperty('attachmentFileName')
            || isNaN(Date.parse(obj.completeDate))
            || ((obj.attachmentFileName !== null) && !fs.existsSync(obj.attachmentFileName))) {
            return null;
        } else {
            const task = new Task(obj.name, new Date(obj.completeDate), obj.attachmentFileName);

            task.completed = obj.completed;
            return task;
        }
    }
}

module.exports = Task;
