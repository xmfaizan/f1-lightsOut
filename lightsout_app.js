document.addEventListener("DOMContentLoaded", () => {
  //DOM elements
  const lights = document.querySelectorAll(".light");
  const timer = document.getElementById("timer");
  const statusMessage = document.getElementById("status-message");
  const resultPopup = document.getElementById("result-popup");
  const resultValue = document.getElementById("result-value");
  const resultMessage = document.getElementById("result-message");
  const tryAgainBtn = document.getElementById("try-again-btn");
  const overlay = document.querySelector(".overlay");
  const bestTimeDisplay = document.getElementById("best-time");
  const avgTimeDisplay = document.getElementById("avg-time");

  // game vars
  let gameState = "ready"; // ready, countdown, lights-on, lights-out, finished
  let startTime, endTime, reactionTime;
  let lightsStartTime;
  let lightsOutTimeout;
  let lightIntervals = [];
  let timerInterval;
  let falseStart = false;

  // stats tracking
  let bestTime = localStorage.getItem("f1_best_time")
    ? parseFloat(localStorage.getItem("f1_best_time"))
    : null;
  let reactionTimes = localStorage.getItem("f1_reaction_times")
    ? JSON.parse(localStorage.getItem("f1_reaction_times"))
    : [];

  // update stats display
  updateStatsDisplay();

  // setup game
  function initGame() {
    // reset lights
    lights.forEach((light) => {
      light.classList.remove("active");
    });

    // reset display
    timer.textContent = "0.000";
    statusMessage.textContent = "READY";
    gameState = "ready";
    falseStart = false;

    // clear timeouts
    clearTimeouts();
  }

  // start game
  function startGame() {
    if (gameState !== "ready") return;

    gameState = "countdown";
    statusMessage.textContent = "WAIT FOR LIGHTS OUT";

    setTimeout(() => {
      startLightsSequence();
    }, 500);
  }

  // f1 style lights sequence
  function startLightsSequence() {
    gameState = "lights-on";
    let currentLight = 0;

    const lightInterval = setInterval(() => {
      for (let column = 0; column < 5; column++) {
        if (column === currentLight) {
          const colLights = document.querySelectorAll(
            `.light-column:nth-child(${column + 1}) .light`
          );
          colLights[2].classList.add("active");
          colLights[3].classList.add("active");
        }
      }

      currentLight++;

      if (currentLight >= 5) {
        clearInterval(lightInterval);

        lightsStartTime = Date.now();

        // random delay
        const lightsOutDelay = Math.random() * 3300 + 700; // 0.7 to 4 seconds

        lightsOutTimeout = setTimeout(() => {
          lightsOut();
        }, lightsOutDelay);
      }
    }, 1000);

    lightIntervals.push(lightInterval);
  }

  // lights out sequence
  function lightsOut() {
    gameState = "lights-out";

    lights.forEach((light) => {
      light.classList.remove("active");
    });

    startTime = Date.now();

    startReactionTimer();
  }

  // reaction timer
  function startReactionTimer() {
    timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      timer.textContent = elapsed.toFixed(3);

      if (elapsed > 5) {
        clearInterval(timerInterval);
        handleMissedStart();
      }
    }, 10);

    lightIntervals.push(timerInterval);
  }

  // handle clicks
  function handleReaction() {
    if (gameState !== "lights-out") {
      if (gameState === "lights-on") {
        handleFalseStart();
      }
      return;
    }

    endTime = Date.now();
    reactionTime = (endTime - startTime) / 1000;

    timer.textContent = reactionTime.toFixed(3);
    gameState = "finished";

    if (!falseStart) {
      recordReactionTime(reactionTime);
    }

    showResult();
  }

  // jump start handler
  function handleFalseStart() {
    clearTimeouts();

    gameState = "finished";
    falseStart = true;
    timer.textContent = "JUMP START";
    statusMessage.textContent = "FALSE START";

    resultValue.textContent = "JUMP START";
    resultMessage.textContent =
      "You moved before the lights went out! You will unfortunately get a five second penalty. Try again!";

    setTimeout(() => {
      showPopup();
    }, 1000);
  }

  // missed start handler
  function handleMissedStart() {
    gameState = "finished";
    statusMessage.textContent = "TOO SLOW";

    resultValue.textContent = "MISSED";
    resultMessage.textContent = "You missed the start! Try again!";

    showPopup();
  }

  // display results
  function showResult() {
    clearInterval(timerInterval);

    resultValue.textContent = reactionTime.toFixed(3);

    // result messages based on time
    let message;
    if (reactionTime < 0.04) {
      message =
        "IMPOSSIBLE START! Valtteri Bottas holds the record for the fastest reaction time in Formula 1 history, achieving a remarkable 0.040 seconds at the 2019 Japanese Grand Prix!";
    } else if (reactionTime < 0.2) {
      message = "PERFECT START! Just like F1 quality!";
    } else if (reactionTime < 0.3) {
      message = "INCREDIBLE START! Like a pro!";
    } else if (reactionTime < 0.4) {
      message = "GREAT START! Very impressive!";
    } else if (reactionTime < 0.5) {
      message = "GOOD START! Solid reaction time!";
    } else if (reactionTime < 0.7) {
      message = "DECENT START! Keep practicing!";
    } else if (reactionTime < 1) {
      message = "SLOW START! You can do better!";
    } else {
      message = "TOO SLOW! You need more practice!";
    }

    resultMessage.textContent = message;

    showPopup();
  }

  // save reaction time
  function recordReactionTime(time) {
    reactionTimes.push(time);

    if (reactionTimes.length > 20) {
      reactionTimes.shift();
    }

    if (bestTime === null || time < bestTime) {
      bestTime = time;
    }

    localStorage.setItem("f1_best_time", bestTime);
    localStorage.setItem("f1_reaction_times", JSON.stringify(reactionTimes));

    updateStatsDisplay();
  }

  // update stats
  function updateStatsDisplay() {
    if (bestTime !== null) {
      bestTimeDisplay.textContent = bestTime.toFixed(3);
    } else {
      bestTimeDisplay.textContent = "--.---";
    }

    if (reactionTimes.length > 0) {
      const sum = reactionTimes.reduce((a, b) => a + b, 0);
      const avg = sum / reactionTimes.length;
      avgTimeDisplay.textContent = avg.toFixed(3);
    } else {
      avgTimeDisplay.textContent = "--.---";
    }
  }

  // popup controls
  function showPopup() {
    resultPopup.classList.add("active");
  }

  function hidePopup() {
    resultPopup.classList.remove("active");
  }

  // clear timers
  function clearTimeouts() {
    clearTimeout(lightsOutTimeout);

    lightIntervals.forEach((interval) => {
      clearInterval(interval);
    });

    clearInterval(timerInterval);

    lightIntervals = [];
  }

  // click handlers
  document.addEventListener("click", () => {
    if (gameState === "ready") {
      startGame();
    } else if (gameState === "lights-on" || gameState === "lights-out") {
      handleReaction();
    }
  });

  // try again button
  tryAgainBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hidePopup();
    initGame();
  });

  // start game
  initGame();
});
