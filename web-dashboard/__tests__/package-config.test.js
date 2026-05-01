'use strict';

/**
 * Tests for package.json and package-lock.json configuration changes introduced in this PR:
 * - nodemailer bumped from ^6.10.1 to ^8.0.5
 * - Added "overrides" section with path-to-regexp ^8.4.0
 * - lockfileVersion updated from 2 to 3
 */

const path = require('path');
const fs = require('fs');
const semver = require('semver');

const PKG_PATH = path.resolve(__dirname, '..', 'package.json');
const LOCK_PATH = path.resolve(__dirname, '..', 'package-lock.json');

let pkg;
let lockfile;

beforeAll(() => {
  pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  lockfile = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
});

describe('package.json - nodemailer version update (^6.10.1 → ^8.0.5)', () => {
  test('nodemailer dependency is declared', () => {
    expect(pkg.dependencies).toHaveProperty('nodemailer');
  });

  test('nodemailer version range is ^8.0.5', () => {
    expect(pkg.dependencies.nodemailer).toBe('^8.0.5');
  });

  test('nodemailer version is v8, not the old v6', () => {
    const range = pkg.dependencies.nodemailer;
    expect(semver.satisfies('8.0.5', range)).toBe(true);
    expect(semver.satisfies('6.10.1', range)).toBe(false);
  });

  test('nodemailer range does not allow v6 or v7', () => {
    const range = pkg.dependencies.nodemailer;
    expect(semver.satisfies('7.9.9', range)).toBe(false);
    expect(semver.satisfies('6.0.0', range)).toBe(false);
  });

  test('nodemailer range requires at least 8.0.5', () => {
    const range = pkg.dependencies.nodemailer;
    expect(semver.satisfies('8.0.4', range)).toBe(false);
    expect(semver.satisfies('8.0.5', range)).toBe(true);
    expect(semver.satisfies('8.1.0', range)).toBe(true);
  });
});

describe('package.json - overrides section (path-to-regexp security fix)', () => {
  test('overrides section exists', () => {
    expect(pkg).toHaveProperty('overrides');
    expect(typeof pkg.overrides).toBe('object');
  });

  test('path-to-regexp override is declared', () => {
    expect(pkg.overrides).toHaveProperty('path-to-regexp');
  });

  test('path-to-regexp override requires ^8.4.0', () => {
    expect(pkg.overrides['path-to-regexp']).toBe('^8.4.0');
  });

  test('path-to-regexp override satisfies 8.4.0 and above', () => {
    const range = pkg.overrides['path-to-regexp'];
    expect(semver.satisfies('8.4.0', range)).toBe(true);
    expect(semver.satisfies('8.4.2', range)).toBe(true);
    expect(semver.satisfies('8.5.0', range)).toBe(true);
  });

  test('path-to-regexp override excludes vulnerable older versions', () => {
    const range = pkg.overrides['path-to-regexp'];
    // Versions prior to 8.4.0 should be excluded by this override
    expect(semver.satisfies('8.3.9', range)).toBe(false);
    expect(semver.satisfies('6.2.2', range)).toBe(false);
    expect(semver.satisfies('0.1.7', range)).toBe(false);
  });
});

describe('package.json - all expected dependencies present', () => {
  const expectedDeps = [
    'bcrypt',
    'cors',
    'express',
    'express-rate-limit',
    'helmet',
    'jsonwebtoken',
    'mongoose',
    'nodemailer',
    'socket.io',
    'uuid',
  ];

  test.each(expectedDeps)('%s is listed as a dependency', (dep) => {
    // Use direct property access to avoid toHaveProperty treating dots as path separators
    expect(pkg.dependencies[dep]).toBeDefined();
  });
});

describe('package-lock.json - lockfileVersion updated to 3', () => {
  test('lockfileVersion is 3', () => {
    expect(lockfile.lockfileVersion).toBe(3);
  });

  test('lockfileVersion is not the old value of 2', () => {
    expect(lockfile.lockfileVersion).not.toBe(2);
  });
});

describe('package-lock.json - nodemailer resolved to v8', () => {
  test('nodemailer package entry exists in packages', () => {
    expect(lockfile.packages).toHaveProperty('node_modules/nodemailer');
  });

  test('resolved nodemailer version is 8.x', () => {
    const resolved = lockfile.packages['node_modules/nodemailer'].version;
    expect(semver.major(resolved)).toBe(8);
  });

  test('resolved nodemailer version is at least 8.0.5', () => {
    const resolved = lockfile.packages['node_modules/nodemailer'].version;
    expect(semver.gte(resolved, '8.0.5')).toBe(true);
  });

  test('resolved nodemailer version is not v6', () => {
    const resolved = lockfile.packages['node_modules/nodemailer'].version;
    expect(semver.major(resolved)).not.toBe(6);
  });
});

describe('package-lock.json - path-to-regexp resolved to v8.4+', () => {
  test('path-to-regexp package entry exists', () => {
    expect(lockfile.packages).toHaveProperty('node_modules/path-to-regexp');
  });

  test('resolved path-to-regexp version satisfies ^8.4.0', () => {
    const resolved = lockfile.packages['node_modules/path-to-regexp'].version;
    expect(semver.satisfies(resolved, '^8.4.0')).toBe(true);
  });

  test('resolved path-to-regexp version is not a vulnerable older version', () => {
    const resolved = lockfile.packages['node_modules/path-to-regexp'].version;
    expect(semver.lt(resolved, '8.4.0')).toBe(false);
  });
});

describe('package-lock.json - root package entry reflects changes', () => {
  test('root package entry has license field', () => {
    expect(lockfile.packages['']).toHaveProperty('license');
  });

  test('root package dependencies include nodemailer', () => {
    expect(lockfile.packages[''].dependencies).toHaveProperty('nodemailer');
  });

  test('root package dependencies include all new packages', () => {
    const deps = lockfile.packages[''].dependencies;
    expect(deps['bcrypt']).toBeDefined();
    expect(deps['cors']).toBeDefined();
    expect(deps['express']).toBeDefined();
    expect(deps['jsonwebtoken']).toBeDefined();
    expect(deps['mongoose']).toBeDefined();
    // Use bracket access: toHaveProperty treats dots as path separators
    expect(deps['socket.io']).toBeDefined();
  });
});