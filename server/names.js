let autoName = 0;
let dupeName = 0;
const autoNames = [
  'Susan',
  'Susan 2',
  'Susan Too',
  'Susie',
  'Susie 2',
  'Susie Q',
  'Susanne',
  'Sultan',
  'Sudan',
  'Sedan',
  'Susanna',
  'Shoshana',
  'Shoshi',
  'Zsuzsanna',
  'Lilium',
  'Sue',
  'Stew',
  'Spew',
  'Soup',
  'Sudo',
  'Soon',
  'Zoo',
  'Zuzu',
  'S.U.S.A.N.',
  'Nasus',
];

const names = new Set();

function addName(name, force) {
  if (!names.size) {
    autoName = dupeName = 0;
  }
  if (!name || names.has(name)) {
    if (!name || force) {
      if (!name) {
        for (let i = 0; i < autoNames.length; ++i) {
          const index = (autoName + i) % autoNames.length;
          autoName = (++autoName) % autoNames.length;
          if (!names.has(autoNames[index])) {
            name = autoNames[index];
            break;
          }
        }
        if (!name) {
          while (true) {
            const index = dupeName % autoNames.length;
            const dupes = Math.floor(dupeName / autoNames.length);
            const suffix = dupes < 4 ? '1'.repeat(dupes + 1)
              : (dupes + 2) + 'b (final).doc';
            ++dupeName;
            name = autoNames[index] + ' ' + suffix;
            if (!names.has(name)) {
              break;
            }
          }
        }
      }
    } else {
      throw new Error('Name already registered!');
    }
  }
  names.add(name);
  return name;
}

function removeName(name) {
  return names.delete(name);
}

function hasName(name) {
  return names.has(name);
}

module.exports = {
  addName,
  removeName,
  hasName,
};
