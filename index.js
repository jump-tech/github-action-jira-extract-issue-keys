"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core = require("@actions/core");
var github = require("@actions/github");
var matchAll = require("match-all");
var Octokit = require("@octokit/rest");
function extractJiraKeysFromCommit() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var regex_1, isPullRequest, isRelease, commitMessage, parseAllCommits, payload, owner, repo, latestTag_1, token, octokit, resultArr_1, prNum, data, result, tags, latestTagIndex, previousTag, data, resultArr_2, result, matches, result, payload_1, resultArr_3, result, matches, result, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 7, , 8]);
                    regex_1 = /((([A-Z]+)|([0-9]+))+-\d+)/g;
                    isPullRequest = core.getInput("is-pull-request") == "true";
                    isRelease = core.getInput("is-release") == "true";
                    commitMessage = core.getInput("commit-message");
                    parseAllCommits = core.getInput("parse-all-commits") == "true";
                    payload = github.context.payload;
                    owner = payload.repository.owner.login;
                    repo = payload.repository.name;
                    latestTag_1 = core.getInput('release-tag') || ((_a = github.context.payload.release) === null || _a === void 0 ? void 0 : _a.tag_name);
                    token = process.env["GITHUB_TOKEN"];
                    octokit = new Octokit({
                        auth: token
                    });
                    if (!isPullRequest) return [3 /*break*/, 2];
                    resultArr_1 = [];
                    prNum = payload.number;
                    return [4 /*yield*/, octokit.pulls.listCommits({
                            owner: owner,
                            repo: repo,
                            pull_number: prNum
                        })];
                case 1:
                    data = (_b.sent()).data;
                    data.forEach(function (item) {
                        var commit = item.commit;
                        var matches = matchAll(commit.message, regex_1).toArray();
                        matches.forEach(function (match) {
                            if (resultArr_1.find(function (element) { return element == match; })) {
                                // console.log(match + " is already included in result array");
                            }
                            else {
                                // console.log(" adding " + match + " to result array");
                                resultArr_1.push(match);
                            }
                        });
                    });
                    result = resultArr_1.join(",");
                    core.setOutput("jira-keys", result);
                    return [3 /*break*/, 6];
                case 2:
                    if (!isRelease) return [3 /*break*/, 5];
                    if (!latestTag_1) {
                        throw new Error("No latest tag found in the release event");
                    }
                    return [4 /*yield*/, octokit.repos.listTags({
                            owner: owner,
                            repo: repo,
                            per_page: 2
                        })];
                case 3:
                    tags = _b.sent();
                    latestTagIndex = tags.data.findIndex(function (tag) { return tag.name === latestTag_1; });
                    if (latestTagIndex === -1) {
                        throw new Error("No previous tag found");
                    }
                    previousTag = tags.data[latestTagIndex + 1].name;
                    console.log("Previous tag: ", previousTag);
                    console.log("Latest tag: ", latestTag_1);
                    return [4 /*yield*/, octokit.repos.compareCommits({
                            owner: owner,
                            repo: repo,
                            base: previousTag,
                            head: latestTag_1
                        })];
                case 4:
                    data = (_b.sent()).data;
                    resultArr_2 = [];
                    data.commits.forEach(function (item) {
                        var commit = item.commit;
                        var matches = matchAll(commit.message, regex_1).toArray();
                        matches.forEach(function (match) {
                            if (resultArr_2.find(function (element) { return element == match; })) {
                                // console.log(match + " is already included in result array");
                            }
                            else {
                                // console.log(" adding " + match + " to result array");
                                resultArr_2.push(match);
                            }
                        });
                    });
                    result = resultArr_2.join(",");
                    console.log("Results jira-keys", result);
                    core.setOutput("jira-keys", result);
                    return [3 /*break*/, 6];
                case 5:
                    // console.log("not a pull request");
                    if (commitMessage) {
                        matches = matchAll(commitMessage, regex_1).toArray();
                        result = matches.join(",");
                        core.setOutput("jira-keys", result);
                    }
                    else {
                        payload_1 = github.context.payload;
                        if (parseAllCommits) {
                            resultArr_3 = [];
                            payload_1.commits.forEach(function (commit) {
                                var matches = matchAll(commit.message, regex_1).toArray();
                                matches.forEach(function (match) {
                                    if (resultArr_3.find(function (element) { return element == match; })) {
                                        // console.log(match + " is already included in result array");
                                    }
                                    else {
                                        // console.log(" adding " + match + " to result array");
                                        resultArr_3.push(match);
                                    }
                                });
                            });
                            result = resultArr_3.join(",");
                            core.setOutput("jira-keys", result);
                        }
                        else {
                            matches = matchAll(payload_1.head_commit.message, regex_1).toArray();
                            result = matches.join(",");
                            core.setOutput("jira-keys", result);
                        }
                    }
                    _b.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    core.setFailed(error_1.message);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
(function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, extractJiraKeysFromCommit()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
})();
exports["default"] = extractJiraKeysFromCommit;
