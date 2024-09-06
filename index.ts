const core = require("@actions/core");
const github = require("@actions/github");
const matchAll = require("match-all");
const { Octokit } = require("@octokit/rest")

async function extractJiraKeysFromCommit() {
  try {
    const regex = /((([A-Z]+)|([0-9]+))+-\d+)/g;
    const isPullRequest = core.getInput("is-pull-request") == "true";
    const isRelease = core.getInput("is-release") == "true";

    // console.log("isPullRequest: " + isPullRequest);
    const commitMessage = core.getInput("commit-message");
    // console.log("commitMessage: " + commitMessage);
    // console.log("core.getInput('parse-all-commits'): " + core.getInput('parse-all-commits'));
    const parseAllCommits = core.getInput("parse-all-commits") == "true";
    // console.log("parseAllCommits: " + parseAllCommits);
    const payload = github.context.payload;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const latestTag = core.getInput('release-version') || github.context.payload.release?.tag_name;

    const token = process.env["GITHUB_TOKEN"];
    const octokit = new Octokit({
      auth: token,
    });

    if (isPullRequest) {
      let resultArr: any = [];

      // console.log("is pull request...");

      const prNum = payload.number;

      const { data } = await octokit.pulls.listCommits({
        owner: owner,
        repo: repo,
        pull_number: prNum,
      });

      data.forEach((item: any) => {
        const commit = item.commit;
        const matches: any = matchAll(commit?.message, regex).toArray();
        matches.forEach((match: any) => {
          if (resultArr.find((element: any) => element == match)) {
            // console.log(match + " is already included in result array");
          } else {
            // console.log(" adding " + match + " to result array");
            resultArr.push(match);
          }
        });
      });

      const result = resultArr.join(",");
      core.setOutput("jira-keys", result);
    } else if (isRelease) {
      if (!latestTag) {
        throw new Error("No latest tag found in the release event");
      }

      // Git the last two releases from the repo
      const releases = await octokit.repos.listReleases({
        owner,
        repo,
        per_page: 100,
      });

      const orderedReleases = releases.sort(
        (a: { created_at: string },
         b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestRelease = orderedReleases[0];
      if (latestRelease.tag_name !== latestTag) {
        throw new Error("Latest tag not found in the tags list");
      }

      const previousRelease = orderedReleases[1];
      const previousTag = previousRelease.tag_name;
      console.log("Previous tag: ", previousTag);
      console.log("Latest tag: ", latestTag);

      const { data } = await octokit.repos.compareCommits({
        owner,
        repo,
        base: previousTag,
        head: latestTag,
      });

      let resultArr: any = [];

      data.commits.forEach((item: any) => {
        console.log("Item: ", item);
        const commit = item.commit;
        const matches: any = matchAll(commit?.message, regex).toArray();
        matches.forEach((match: any) => {
          if (resultArr.find((element: any) => element == match)) {
            // console.log(match + " is already included in result array");
          } else {
            // console.log(" adding " + match + " to result array");
            resultArr.push(match);
          }
        });
      });
      const result = resultArr.join(",");
      console.log("Results jira-keys", result);
      core.setOutput("jira-keys", result);
    } else {
      // console.log("not a pull request");

      if (commitMessage) {
        // console.log("commit-message input val provided...");
        const matches = matchAll(commitMessage, regex).toArray();
        const result = matches.join(",");
        core.setOutput("jira-keys", result);
      } else {
        // console.log("no commit-message input val provided...");
        const payload = github.context.payload;

        if (parseAllCommits) {
          // console.log("parse-all-commits input val is true");
          let resultArr: any = [];

          payload.commits.forEach((commit: any) => {
            const matches = matchAll(commit?.message, regex).toArray();
            matches.forEach((match: any) => {
              if (resultArr.find((element: any) => element == match)) {
                // console.log(match + " is already included in result array");
              } else {
                // console.log(" adding " + match + " to result array");
                resultArr.push(match);
              }
            });
          });

          const result = resultArr.join(",");
          core.setOutput("jira-keys", result);
        } else {
          // console.log("parse-all-commits input val is false");
          // console.log("head_commit: ", payload.head_commit);
          const matches = matchAll(
            payload.head_commit?.message,
            regex,
          ).toArray();
          const result = matches.join(",");
          core.setOutput("jira-keys", result);
        }
      }
    }
  } catch (error) {
    core.setFailed(error?.message);
  }
}

(async function () {
  await extractJiraKeysFromCommit();
  // console.log("finished extracting jira keys from commit message");
})();

export default extractJiraKeysFromCommit;
