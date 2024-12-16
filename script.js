// Get references to the DOM elements
const num1Element = document.getElementById("num1");
const operatorElement = document.getElementById("operator");
const num2Element = document.getElementById("num2");
const answerInput = document.getElementById("answer");
const difficultySlider = document.querySelector('input[type="range"]'); // Difficulty range slider
const currentStudyModeLabel = document.getElementById("current-study-mode");

let currentProblem = {}; // Store the current problem object
let timesTable = []; // Store the times table based on difficulty
const maxPreviousProblems = 8; // Limit for showing previous problems

let currentMode = 'practice'; // Default mode is Practice

// Function to get the selected operations from the checkboxes
function getSelectedOperations() {
    const selectedOperations = [];
    if (document.getElementById("add").checked) selectedOperations.push('+');
    if (document.getElementById("subtract").checked) selectedOperations.push('-');
    if (document.getElementById("multiply").checked) selectedOperations.push('×');
    if (document.getElementById("divide").checked) selectedOperations.push('÷');
    return selectedOperations;
}

// Function to get the current difficulty range based on the slider value
function getMaxTimesTableFactor() {
    const difficulty = difficultySlider.value;
    switch (difficulty) {
        case '1': return 5;  // Easy
        case '2': return 10; // Medium
        case '3': return 12; // Moderate
        case '4': return 20; // Challenging
        case '5': return 25; // Hard
        default: return 12;  // Default to 12
    }
}

// Function to get the max value for addition and subtraction based on difficulty
function getMaxAdditionSubtractionValue() {
    const difficulty = difficultySlider.value;
    switch (difficulty) {
        case '1': return 10;   // Easy
        case '2': return 20;   // Medium
        case '3': return 40;   // Moderate
        case '4': return 60;   // Challenging
        case '5': return 100;  // Hard
        default: return 20;    // Default max for addition/subtraction
    }
}

// Function to generate a 2D times table based on the difficulty level
function generateTimesTable(maxFactor) {
    const timesTable = [];
    let idNumber = 0;
    for (let i = 0; i <= maxFactor; i++) {
        const row = [];
        for (let j = 0; j <= maxFactor; j++) {
            row.push({
                id: idNumber,
                factor1: i,
                factor2: j,
                answer: i * j
            });
            idNumber++;
            
        }
        timesTable.push(row);
    }
    console.log(timesTable);
    return timesTable;
}

// Function to get the max value for addition and subtraction based on difficulty
function getMaxAdditionSubtractionValue() {
    const difficulty = difficultySlider.value;
    switch (difficulty) {
        case '1': return 10;   // Easy
        case '2': return 20;   // Medium
        case '3': return 40;   // Moderate
        case '4': return 60;   // Challenging
        case '5': return 100;  // Hard
        default: return 20;    // Default max for addition/subtraction
    }
}


// Function to generate a problem from the times table or other operations
function generateProblem() {
    const operations = getSelectedOperations();

    // If no operation is selected, alert the user
    if (operations.length === 0) {
        alert("Please select at least one operation.");
        return;
    }

    // Get the current difficulty level for times tables
    const maxFactor = Math.min(getMaxTimesTableFactor(), 25); // Ensure max factor for multiplication/division is capped at 25

    // If we don't have a valid timesTable for the current difficulty, generate it
    if (!timesTable.length || timesTable[0][0].factor1 > maxFactor) {
        timesTable = generateTimesTable(maxFactor); // Generate the times table based on difficulty
    }

    // Randomly choose an operation
    const operator = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, correctAnswer;
    let validProblem = false;

    while (!validProblem) {
        switch (operator) {
            case '+':
                // Get a higher max number for addition based on difficulty
                const maxAdditionSubtractionValue = getMaxAdditionSubtractionValue();
                num1 = Math.floor(Math.random() * (maxAdditionSubtractionValue + 1));
                num2 = Math.floor(Math.random() * (maxAdditionSubtractionValue + 1));
                correctAnswer = num1 + num2;
                validProblem = true;
                break;

            case '-':
                // Use the same max value for subtraction
                const maxSubtractionValue = getMaxAdditionSubtractionValue();
                num1 = Math.floor(Math.random() * (maxSubtractionValue + 1));
                num2 = Math.floor(Math.random() * (num1 + 1)); // Ensure no negative results
                correctAnswer = num1 - num2;
                validProblem = true;
                break;

            case '×':
                // Select a random ID from the times table (multiplication)
                const randomId = Math.floor(Math.random() * timesTable.length * timesTable[0].length);
                const cell = getCellById(randomId);
                console.log(randomId);
                num1 = cell.factor1;
                num2 = cell.factor2;
                correctAnswer = cell.answer;
                validProblem = true;
                break;

            case '÷':
                // Select a random ID for division and reverse the multiplication logic
                const randomDivisionId = Math.floor(Math.random() * timesTable.length * timesTable[0].length);
                const divisionCell = getCellById(randomDivisionId);

                // Ensure the dividend is non-zero
                if (divisionCell.answer !== 0) {
                    num1 = divisionCell.answer; // Use the product as the dividend
                    num2 = divisionCell.factor1; // Use one of the factors as the divisor
                    correctAnswer = num1 / num2; // The correct answer for division
                    validProblem = true;
                } else {
                    // Skip zero products to avoid trivial division (e.g., 0 ÷ 0)
                    validProblem = false;
                }
                break;
        }
    }

    // Store the current problem
    currentProblem = { num1, operator, num2, correctAnswer };

    // Update the question on the page
    num1Element.textContent = num1;
    operatorElement.textContent = operator;
    num2Element.textContent = num2;
    answerInput.value = ''; // Clear the answer input
    answerInput.style.backgroundColor = ''; // Reset background color

    // For Learn Mode, show the correct answer as placeholder after a slight delay
    if (currentMode === 'learn') {
        setTimeout(() => {
            answerInput.placeholder = currentProblem.correctAnswer;
            answerInput.style.color = '#d4d4d4'; // Light gray color for placeholder
        }, 1000); // Delay of 1 second before showing the answer
    }
}

// Function to get the cell by its unique ID from the times table
function getCellById(id) {
    for (let row of timesTable) {
        for (let cell of row) {
            if (cell.id === id) {
                return cell;
            }
        }
    }
    return null; // If the ID doesn't exist, return null
}

function checkAnswer() {
    const userAnswer = parseFloat(answerInput.value);

    // Store whether the answer was correct or incorrect
    const isCorrect = userAnswer === currentProblem.correctAnswer;

    // Remove previous color classes to reset the input box's appearance
    answerInput.classList.remove('correct-answer', 'incorrect-answer', 'pulse', 'shake');

    // Disable the input field during the delay to prevent further interaction
    answerInput.disabled = true;

    // Add the appropriate class for correct or incorrect answers
    if (isCorrect) {
        answerInput.classList.add('correct-answer'); // Correct answer (green)
        // Add the pulse animation for correct answer
        answerInput.classList.add('pulse');
    } else {
        answerInput.classList.add('incorrect-answer'); // Incorrect answer (red)
        // Display the correct answer in light gray if the answer is wrong
        answerInput.value = currentProblem.correctAnswer; // Show the correct answer
        answerInput.style.color = '#d3d3d3'; // Light gray color for correct answer
        // Add the shake animation for incorrect answer
        answerInput.classList.add('shake');
    }

    // Add the problem to the "Previous Problems" section
    addPreviousProblem(currentProblem.num1, currentProblem.operator, currentProblem.num2, currentProblem.correctAnswer, isCorrect ? 'correct' : 'wrong');

    // If the answer is correct, generate the next question immediately
    if (isCorrect) {
        setTimeout(() => {
            // Reset the input field's background color and remove any feedback class after 250ms
            answerInput.classList.remove('correct-answer', 'pulse');
            answerInput.style.backgroundColor = ''; // Clear the background color (if any)
        }, 500); // 250ms delay to clear the feedback (green color)

        generateProblem();  // Generate the next question

        // Re-enable the input field for the next question
        setTimeout(() => {
            answerInput.disabled = false;
        }, 250); // Re-enable after the brief delay
    } else {
        // If the answer is incorrect, wait 3000ms (3 seconds) before generating the next question
        setTimeout(() => {
            // Reset the input box background to default and prepare for the next question
            answerInput.classList.remove('correct-answer', 'incorrect-answer', 'pulse', 'shake');
            answerInput.style.backgroundColor = ''; // Clear any background color
            answerInput.style.color = '#02160F'; // Reset color to original text color (black)
            answerInput.value = ''; // Clear the input field for the next question
            generateProblem(); // Generate the next question
            // Re-enable the input field after the delay
            answerInput.disabled = false;
        }, 3000);  // 3000ms = 3 seconds delay for incorrect answers
    }
}


// Function to add a previous problem to the "Previous Problems" section
function addPreviousProblem(num1, operator, num2, answer, status) {
    const prevProblemsContainer = document.querySelector('.previous-problems');

    // Create a new div for the previous problem
    const problemElement = document.createElement('div');
    problemElement.classList.add('prev-problem', status);
    problemElement.innerHTML = `${num1} ${operator} ${num2} = ${answer}`;

    // Append the new problem to the container
    prevProblemsContainer.appendChild(problemElement);

    // Ensure we only show the last 'maxPreviousProblems' problems
    const allProblems = prevProblemsContainer.querySelectorAll('.prev-problem');
    if (allProblems.length > maxPreviousProblems) {
        // Remove the first (oldest) problem
        prevProblemsContainer.removeChild(allProblems[0]);
    }
}

// Listen for input events on the answer field (Learn Mode)
answerInput.addEventListener('input', function () {
    if (currentMode === 'learn') {
        // When the user starts typing, remove the placeholder
        answerInput.placeholder = '';

        // Change the text color to the normal color once they start typing
        answerInput.style.color = '#02160F';  // Dark font for typed answer
    }
});

// Listen for the Enter keypress event on the input field
answerInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default action of the Enter key (form submission or page reload)
        checkAnswer(); // Call the function to check the answer
    }
});

// Add event listener to the difficulty slider to reshuffle problems when changed
difficultySlider.addEventListener('input', function () {
    generateProblem(); // Reshuffle the question when the difficulty changes
});

difficultySlider.addEventListener('input', function () {
    // Regenerate times table based on new difficulty
    const maxFactor = Math.min(getMaxTimesTableFactor(), 25); // Ensure max factor for multiplication/division is capped at 25
    timesTable = generateTimesTable(maxFactor); // Regenerate the times table for new difficulty level
    generateProblem(); // Regenerate the problem after difficulty change
});

// Add event listener to mode selector
document.getElementById('mode-selector').addEventListener('change', (event) => {
    currentMode = event.target.value;
    currentStudyModeLabel.innerText = currentMode;
    generateProblem();  // Regenerate the problem according to the selected mode
});

// Generate the first problem when the page loads
window.onload = generateProblem;
