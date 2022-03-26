import { performance } from "perf_hooks";

const urlList = [];
const charDict = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "-",
  "_",
];

Array.prototype.sample = function () {
  return this[Math.floor(Math.random() * this.length)];
};

function generateRandomUrl(min = 3, max = 20) {
  let newUrl = new Array(Math.round(Math.random() * max + min)).fill();

  return newUrl
    .map(() => charDict[Math.round(Math.random() * (charDict.length - 1))])
    .reduce((acc, cur) => acc + cur);
}

function isInUrlList(url, urlList) {
  const pattern = /^(?<scheme>[a-z0-9]*:\/\/)(?<host>[^/]*)/;
  const matches = url.match(pattern);
  if (!matches?.groups?.scheme || !matches?.groups?.host) return false;

  url =
    (["http://", "https://"].includes(matches.groups.scheme)
      ? ""
      : matches.groups.scheme) + matches.groups.host;
  return urlList.includes(url);
}

const performances = [];

for (let i = 0; i < 10 ** 3; i++) {
  let t0 = performance.now();
  const urlList = new Array(1000).fill().map(() => generateRandomUrl());
  const url = ["https://", "http://"].sample() + [urlList.sample()].sample();
  let isIn = isInUrlList(url, urlList);
  let t1 = performance.now();
  performances.push(t1 - t0);
}

console.log(performances.reduce((acc, cur) => acc + cur) / performances.length);
