const firstNameReg = new RegExp("^[a-z]+");
const secondNameReg = new RegExp("(?<=_)[a-z]+");

export class RegexHelper {

    constructor() {
    }

    firstNameRegex(fullName) {
        const match = fullName.match(firstNameReg);
        return match ? this.capitalize(match[0]) : null;
    }

    secondNameRegex(fullName) {
        const match = fullName.match(secondNameReg);
        return match ? this.capitalize(match[0]) : null;
    }

    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
}