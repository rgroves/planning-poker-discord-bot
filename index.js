require("dotenv").config();

const { Client, Collection } = require("discord.js");

const Poker = require("./poker");

const client = new Client();

const games = new Collection();

client.on("ready", () => {
  console.log("I am ready!");
});

client.on("message", (message) => {
  if (message.author.username === "planning-poker-bot") return;

  if (message.content === "!start") {
    if (games.has(message.channel.id)) {
      message.channel.send("Game is already in progress in this channel!");
      return;
    }

    games.set(message.channel.id, true);
    message.channel.send(
      "Welcome to Planning Poker!\n" +
        "\n" +
        "Start the first round with:\n" +
        "> !play [STORY]\n" +
        "\n" +
        "[STORY] should be the user story for this round, for example:\n" +
        "> !play As a user I can edit my profile so that it is up-to-date.\n" +
        "\n" +
        "You'll have 30 seconds to send me a DM containing a single number representing " +
        "your estimated story points (an easy way to DM me is to click my name above).\n" +
        "\n" +
        "Stop playing at any time with:\n" +
        "> !end"
    );

    return;
  }

  if (message.content.startsWith("!play")) {
    if (Poker.isQuestionRunning) return;

    const question = message.content.split(" ").splice(1).join(" ");

    message.channel.send(
      `Current question: ${question}\nPlease provide your guesses.`
    );

    Poker.playQuestion(question);

    setTimeout(() => {
      let estimates = Poker.currentAnswers.map(
        (answer) => `* ${answer.user}: ${answer.points}`
      );

      message.channel.send(
        "Time's up! Discuss the estimates provided and then submit the final " +
          "story points for the story with:\n" +
          "> !storypoints [FINAL]\n" +
          "\n" +
          "Where [FINAL] is the agreed upon amount.\n" +
          "\n" +
          "The estimates I received were as follows:\n" +
          estimates.join("\n")
      );
    }, 30 * 1000);

    return;
  }

  if (message.content.startsWith("!storypoints")) {
    if (!Poker.isQuestionRunning) return;

    const storypoints = message.content.split(" ")[1];

    message.channel.send(
      `${storypoints} has been assigned to the story: ${Poker.currentQuestion}`
    );

    Poker.finishQuestion(storypoints);
  }

  if (message.content === "!end") {
    message.channel.send(
      "Planning Poker has ended.\n\n" + "Here is an overview of your game:"
    );

    if (games.has(message.channel.id)) games.delete(message.channel.id);

    for (const question of Poker.questions) {
      message.channel.send(
        `${question.storypoints} story points were assigned to the story: ${question.question}`
      );
    }

    Poker.finishGame();

    return;
  }

  if (message.channel.type === "dm" && Poker.isQuestionRunning) {
    Poker.addAnswer(message.author.username, message.content);
  }
});

client.login(process.env.DISCORD_SECRET);
