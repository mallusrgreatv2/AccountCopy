// const { Client } = require("discord.js-selfbot-v13");
const fs = require("fs");
let Client;
try {
  Client = require("discord.js-selfbot-v13")?.Client;
} catch (err) {
  console.log("Installing...");
  const cp = require("child_process");
  let packageExists = false;
  try {
    fs.readFileSync("./package.json");
    packageExists = true;
  } catch (err) {
    packageExists = false;
  }
  if (packageExists) cp.execSync("npm init -y");
  cp.execSync("npm i discord.js-selfbot-v13@2.15.0 dotenv@16.3.1");
  Client = require("discord.js-selfbot-v13").Client;
}
try {
  fs.readFileSync("./.env");
} catch (err) {
  fs.writeFileSync(
    "./.env",
    `HOST_TOKEN=xxxx
# Multiple users are not needed to make this selfbot work.
USER_ID_1=xxxx
USER_ID_2=xxxx
USER_ID_3=xxxx
`
  );
  console.log("Created .env file. Configure it properly and start again.");
  process.exit(1);
}
require("dotenv/config");

if (!process.env.HOST_TOKEN || !process.env.USER_ID_1) {
  console.log(
    ".env file is not configured properly. Both HOST_TOKEN and USER_ID_1 doesn't exist."
  );
  process.exit(1);
}

const userIds = Object.keys(process.env)
  .filter((a) => a.startsWith("USER_ID_"))
  .map((a) => process.env[a]);

const client = new Client({
  autoRedeemNitro: true,
  checkUpdate: false,
});
const wrongUserIds = [];
for (let userId of userIds) {
  client.users.fetch(userId).catch(() => wrongUserIds.push(userId));
}
if (wrongUserIds.length) {
  console.log(
    `Some user IDs provided couldn't be fetched: ${wrongUserIds.join(", ")}`
  );
  process.exit(1);
}
client.on("ready", async (cl) => {
  console.log(cl.user.username);
});
try {
  client.on("messageCreate", async (msg) => {
    if (!userIds.includes(msg.author.id)) return;
    if (msg.content.toLowerCase().startsWith(">>copy")) {
      await msg.delete();
      const user = msg.mentions.users.size
        ? await (
            await client.users.fetch(msg.mentions.users.first().id)
          ).getProfile()
        : await msg.author.fetch(true);
      const json = {
        aboutMe: user.bio,
        username: user.username,
        globalName: user.globalName,
        pfp: user.displayAvatarURL({ dynamic: true }),
        pronouns: user.pronouns,
        banner: user.banner ? user.bannerURL({ dynamic: true }) : null,
      };
      fs.writeFileSync("./copy.json", JSON.stringify(json));
      console.log(`>>copy | Copied ${user.tag}`);
    }
    if (msg.content.startsWith(">>paste")) {
      await msg.delete();
      let content;
      try {
        content = fs.readFileSync("./copy.json").toString("utf-8");
      } catch (err) {
        return;
      }
      content = JSON.parse(content);
      if (content.aboutMe) await client.user.setAboutMe(content.aboutMe);
      if (content.globalName)
        await client.user.setGlobalName(content.globalName);
      else await client.user.setGlobalName(content.username);
      if (content.pfp) await client.user.setAvatar(content.pfp);
      if (content.pronouns) await client.user.setPronouns(content.pronouns);
      if (client.user.nitroType === 2 && content.banner)
        await client.user.setBanner(content.banner);
      console.log(`>>paste | Pasted to ${client.user.tag}`);
    }
    if (msg.content.toLowerCase().startsWith(">>impersonate")) {
      await msg.delete();
      const user = await (
        await client.users
          .fetch(msg.mentions.users.first()?.id || msg.content.split(/ +/gi)[1])
          .catch(() => {
            throw new Error(">>impersonate | Invalid user mentioned");
          })
      )
        .getProfile()
        .catch(() => {
          throw new Error(">>impersonate | Invalid user mentioned");
        });
      const json = {
        aboutMe: user.bio,
        username: user.username,
        globalName: user.globalName,
        pfp: user.displayAvatarURL({ dynamic: true }),
        pronouns: user.pronouns,
        banner: user.banner ? user.bannerURL({ dynamic: true }) : null,
      };
      await client.user.setAboutMe(json.aboutMe);
      if (json.globalName) await client.user.setGlobalName(json.globalName);
      else await client.user.setGlobalName(json.username);
      if (json.pfp) await client.user.setAvatar(json.pfp);
      if (json.pronouns) await client.user.setPronouns(json.pronouns || "");
      if (client.user.nitroType === 2 && json.banner)
        await client.user.setBanner(json.banner);
      console.log(`>>impersonate | Impersonated ${user.tag}`);
    }
  });
} catch (err) {
  console.error(err);
}
client.login(process.env.HOST_TOKEN).catch((err) => {
  if (err.code === "TOKEN_INVALID") {
    console.log("Invalid token provided in .env");
    process.exit(1);
  }
  throw err;
});
