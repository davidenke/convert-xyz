#!/usr/bin/node

import {createWriteStream, readFileSync} from 'fs';
import {PNG} from 'pngjs';

type Lat = number;
type Lng = number;
type Height = number;

const [, , source, target] = process.argv;

let min: Height | undefined = undefined;
let max: Height | undefined = undefined;
const map = new Map<Lng, Map<Lat, Height>>();

try {
  console.info(`Parsing file ${source}...`);
  readFileSync(source)
    .toString()
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const [lng, lat, height] = line.split(' ').map(parseFloat);
      if (min === undefined || height < min) min = height;
      if (max === undefined || height > max) max = height;
      if (!map.has(lng)) map.set(lng, new Map());
      map.get(lng)!.set(lat, height);
      return [lng, lat, height];
    });
} catch (error) {
  console.error(`File ${source} could not be parsed.`);
  process.exit(1);
}

try {
  console.info(`Writing file ${target}...`);

  const png = new PNG({height: map.size, width: map.size});
  const lightest = 0;
  const darkest = 255;
  const deltaColor = darkest - lightest;
  const deltaHeights = max! - min!;

  let index = 0;
  map.forEach((row) => {
    row!.forEach((height) => {
      const idx = index << 2;
      const color = lightest + height! / deltaHeights * deltaColor;
      png.data[idx] = color;
      png.data[idx + 1] = color;
      png.data[idx + 2] = color;
      png.data[idx + 3] = 255;
      index++;
    });
  });

  png.pack().pipe(createWriteStream(target));
} catch (error) {
  console.error(`File ${target} could not be written.`);
  process.exit(2);
}
