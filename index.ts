const core = require("@actions/core");
const github = require("@actions/github");
const matchAll = require("match-all");
const { Octokit } = require("@octokit/rest")

async function extractJiraKeysFromCommit() {
  try {
    const regex = /((([A-Z]+)|([0-9]+))+-\d+)/g;
    const isPullRequest = core.getInput("is-pull-request") == "true";
    const isRelease = core.getInput("is-release") == "true";

    const commitMessage = core.getInput("commit-message");
    const parseAllCommits = core.getInput("parse-all-commits") == "true";
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

      const prNum = payload.number;
      console.log(`Parsing commits in pull request  ${prNum} for Jira keys`);

      const data = await octokit.paginate("GET /repos/{owner}/{repo}/pulls/{pull_number}/commits", {
          owner: owner,
          repo: repo,
          pull_number: prNum,
          per_page: 100,
        })
      console.log(data);
      console.log(`Retrieved ${data.length} commits for PR`);

      data.forEach((item: any) => {
        const commit = item.commit;
        console.log(`Parsing commit message for jira keys: ${commit?.message}`);
        const matches: any = matchAll(commit?.message, regex).toArray();
        matches.forEach((match: any) => {
          if (resultArr.find((element: any) => element == match)) {
          } else {
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
      console.log(`Parsing commits in release event for Jira keys. Latest tag: ${latestTag}`);

      // Git the last two releases from the repo
      const releases = await octokit.repos.listReleases(
        {
          owner,
          repo,
          per_page: 100,
        },
        (response: { data: any }) => response.data,
      );

      const orderedReleases = releases.data.sort(
        (a: { created_at: string },
         b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestRelease = orderedReleases[0];
      if (latestRelease.tag_name !== latestTag) {
        throw new Error("Latest tag not found in the release list");
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
        console.log(`Parsing commit message for jira keys: ${commit?.message}`);
        const matches: any = matchAll(commit?.message, regex).toArray();
        matches.forEach((match: any) => {
          if (resultArr.find((element: any) => element == match)) {
          } else {
            resultArr.push(match);
          }
        });
      });
      const result = resultArr.join(",");
      console.log("Results jira-keys", result);
      core.setOutput("jira-keys", result);
    } else {
      console.log("Not a pull request or release event. Parsing commit messages for Jira keys");

      if (commitMessage) {
        console.log(`Parsing commit message for jira keys: ${commitMessage}`);
        const matches = matchAll(commitMessage, regex).toArray();
        const result = matches.join(",");
        core.setOutput("jira-keys", result);
      } else {
        const payload = github.context.payload;

        if (parseAllCommits) {
          let resultArr: any = [];

          payload.commits.forEach((commit: any) => {
            console.log(`Parsing commit message for jira keys: ${commit?.message}`);
            const matches = matchAll(commit?.message, regex).toArray();
            matches.forEach((match: any) => {
              if (resultArr.find((element: any) => element == match)) {
              } else {
                resultArr.push(match);
              }
            });
          });

          const result = resultArr.join(",");
          core.setOutput("jira-keys", result);
        } else {
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
})();

export default extractJiraKeysFromCommit;
