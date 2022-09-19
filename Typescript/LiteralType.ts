function calculate(left: number, right: number, op: "add" | "minus") {
  if (op === "add") {
    return left + right;
  } else {
    return left - right;
  }
}

console.log(calculate(3, 4, "add"));
console.log(calculate(3, 4, "minus"));
// console.log(calculate(3, 4, "multiply"));
