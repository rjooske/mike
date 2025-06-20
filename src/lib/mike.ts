import { unreachable } from "./util";

export const MIKE_DATA_KEY = "mike-data";

export type Instructor = {
  name: string;
  namePronunciation: string;
  homeAddress: string;
  officeAddress: string;
  jobName: string;
  courseId: string;
  courseName: string;
  courseTerm: string;
  totalDuration: number;
};

function isInstructor(x: unknown): x is Instructor {
  return (
    typeof x === "object" &&
    x !== null &&
    "name" in x &&
    typeof x.name === "string" &&
    "namePronunciation" in x &&
    typeof x.namePronunciation === "string" &&
    "homeAddress" in x &&
    typeof x.homeAddress === "string" &&
    "officeAddress" in x &&
    typeof x.officeAddress === "string" &&
    "jobName" in x &&
    typeof x.jobName === "string" &&
    "courseId" in x &&
    typeof x.courseId === "string" &&
    "courseName" in x &&
    typeof x.courseName === "string" &&
    "courseTerm" in x &&
    typeof x.courseTerm === "string" &&
    "totalDuration" in x &&
    typeof x.totalDuration === "number"
  );
}

export type EntryUrls = {
  toTsukubaStation: string;
  toDaisanAreaMae: string;
};

function isEntryUrls(x: unknown): x is EntryUrls {
  return (
    typeof x === "object" &&
    x !== null &&
    "toTsukubaStation" in x &&
    typeof x.toTsukubaStation === "string" &&
    "toDaisanAreaMae" in x &&
    typeof x.toDaisanAreaMae === "string"
  );
}

export type Destination = "tsukuba-station" | "daisan-area-mae";

function isDestination(x: unknown): x is Destination {
  return x === "tsukuba-station" || x === "daisan-area-mae";
}

export function displayDestination(d: Destination): string {
  switch (d) {
    case "tsukuba-station":
      return "つくば駅";
    case "daisan-area-mae":
      return "第三エリア前";
    default:
      unreachable(d);
  }
}

export type ExternalInfo = {
  paid: boolean;
  paidAmount: number;
  near: boolean;
  nearestStation: string;
  destination: Destination;
  count: number;
  dayCount: number;
  accomodationFee: number;
};

export function defaultExternalInfo(): ExternalInfo {
  return {
    paid: false,
    paidAmount: 0,
    near: true,
    nearestStation: "",
    destination: "tsukuba-station",
    count: 0,
    dayCount: 0,
    accomodationFee: 0,
  };
}

function isExternalInfo(x: unknown): x is ExternalInfo {
  return (
    typeof x === "object" &&
    x !== null &&
    "paid" in x &&
    typeof x.paid === "boolean" &&
    "paidAmount" in x &&
    typeof x.paidAmount === "number" &&
    "near" in x &&
    typeof x.near === "boolean" &&
    "nearestStation" in x &&
    typeof x.nearestStation === "string" &&
    "destination" in x &&
    isDestination(x.destination) &&
    "count" in x &&
    typeof x.count === "number" &&
    "dayCount" in x &&
    typeof x.dayCount === "number" &&
    "accomodationFee" in x &&
    typeof x.accomodationFee === "number"
  );
}

export type Entry = {
  instructor: Instructor;
  fromHome: EntryUrls;
  fromOffice: EntryUrls;
  externalInfo: ExternalInfo;
};

function isEntry(x: unknown): x is Entry {
  return (
    typeof x === "object" &&
    x !== null &&
    "instructor" in x &&
    isInstructor(x.instructor) &&
    "fromHome" in x &&
    isEntryUrls(x.fromHome) &&
    "fromOffice" in x &&
    isEntryUrls(x.fromOffice) &&
    "externalInfo" in x &&
    isExternalInfo(x.externalInfo)
  );
}

function areEntries(x: unknown): x is Entry[] {
  if (!Array.isArray(x)) {
    return false;
  }
  for (const e of x) {
    if (!isEntry(e)) {
      return false;
    }
  }
  return true;
}

export type MikeData = {
  filename: string;
  title: string;
  wage: number;
  entries: Entry[];
};

function isMikeData(x: unknown): x is MikeData {
  return (
    typeof x === "object" &&
    x !== null &&
    "filename" in x &&
    typeof x.filename === "string" &&
    "title" in x &&
    typeof x.title === "string" &&
    "wage" in x &&
    typeof x.wage === "number" &&
    "entries" in x &&
    areEntries(x.entries)
  );
}

export function serializeMikeData(m: MikeData): string {
  return JSON.stringify(m);
}

export function deserializeMikeData(s: string): MikeData | undefined {
  let x: unknown;
  try {
    x = JSON.parse(s);
  } catch {
    return undefined;
  }
  if (!isMikeData(x)) {
    return undefined;
  }
  return x;
}
