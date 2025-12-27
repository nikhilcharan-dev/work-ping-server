import { spawnSync } from "child_process";

// helper
function run(cmd, args) {
    const result = spawnSync(cmd, args, {
        stdio: "inherit",
        shell: false
    });

    if (result.status !== 0) {
        process.exit(result.status);
    }
}

// read message
const message = process.argv.slice(2).join(" ").trim();

if (!message) {
    console.error("❌ Commit message required");
    process.exit(1);
}

// stage
run("git", ["add", "."]);

// check staged changes
const diff = spawnSync("git", ["diff", "--cached", "--quiet"]);
const hasChanges = diff.status !== 0;

// commit only if needed
if (hasChanges) {
    run("git", ["commit", "-m", message]);
} else {
    console.log("ℹ️ Nothing to commit");
}

// push
run("git", ["push"]);