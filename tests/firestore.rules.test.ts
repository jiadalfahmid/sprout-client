import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';

const PROJECT_ID = 'sprout-test-project';
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8088,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Security Rules - Shared Households', () => {
  const ownerA = 'user_A';
  const memberB = 'user_B';
  const outsiderC = 'user_C';

  it('allows owner A to create households/A, but forbids B from creating households/A', async () => {
    const dbA = testEnv.authenticatedContext(ownerA).firestore();
    const dbB = testEnv.authenticatedContext(memberB).firestore();

    // A creates own household -> allowed
    await assertSucceeds(
      setDoc(doc(dbA, 'households', ownerA), {
        ownerUid: ownerA,
        members: {
          [ownerA]: { role: 'owner', name: 'Alice', email: 'alice@test.com', joinedAt: '2026-01-01' },
        },
        createdAt: '2026-01-01',
      })
    );

    // B tries to create households/A -> denied
    await assertFails(
      setDoc(doc(dbB, 'households', ownerA), {
        ownerUid: ownerA,
        members: {
          [memberB]: { role: 'owner', name: 'Bob', email: 'bob@test.com', joinedAt: '2026-01-01' },
        },
        createdAt: '2026-01-01',
      })
    );
  });

  it('forbids B from adding themselves to household A directly, but allows owner A to add B, and allows B to leave', async () => {
    // Setup household A with owner A using admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'households', ownerA), {
        ownerUid: ownerA,
        members: {
          [ownerA]: { role: 'owner', name: 'Alice', email: 'alice@test.com', joinedAt: '2026-01-01' },
        },
        createdAt: '2026-01-01',
      });
    });

    const dbB = testEnv.authenticatedContext(memberB).firestore();
    const dbA = testEnv.authenticatedContext(ownerA).firestore();

    // B tries to arbitrarily add themselves to household A -> DENIED (must be via serverless/owner)
    await assertFails(
      updateDoc(doc(dbB, 'households', ownerA), {
        [`members.${memberB}`]: { role: 'member', name: 'Bob', email: 'bob@test.com', joinedAt: '2026-01-01' },
      })
    );

    // B tries to maliciously add outsider C -> DENIED
    await assertFails(
      updateDoc(doc(dbB, 'households', ownerA), {
        [`members.${outsiderC}`]: { role: 'member', name: 'Charlie', email: 'c@test.com', joinedAt: '2026-01-01' },
      })
    );

    // B tries to maliciously remove owner A -> DENIED
    await assertFails(
      updateDoc(doc(dbB, 'households', ownerA), {
        [`members.${ownerA}`]: deleteField(),
      })
    );

    // Owner A adds member B -> ALLOWED
    await assertSucceeds(
      updateDoc(doc(dbA, 'households', ownerA), {
        [`members.${memberB}`]: { role: 'member', name: 'Bob', email: 'bob@test.com', joinedAt: '2026-01-01' },
      })
    );

    // Once added, B removes only themselves (leaving the household) -> ALLOWED
    await assertSucceeds(
      updateDoc(doc(dbB, 'households', ownerA), {
        [`members.${memberB}`]: deleteField(),
      })
    );
  });

  it('permission test: Member B can read and write to users/A/medicines, but outsider C cannot', async () => {
    // Setup household A with owner A and accepted member B
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'households', ownerA), {
        ownerUid: ownerA,
        members: {
          [ownerA]: { role: 'owner', name: 'Alice', email: 'alice@test.com', joinedAt: '2026-01-01' },
          [memberB]: { role: 'member', name: 'Bob', email: 'bob@test.com', joinedAt: '2026-01-01' },
        },
        createdAt: '2026-01-01',
      });

      // Also create an existing medicine in users/A/medicines/med1
      await setDoc(doc(context.firestore(), 'users', ownerA, 'medicines', 'med1'), {
        name: 'Aspirin',
        dosage: 100,
      });
    });

    const dbB = testEnv.authenticatedContext(memberB).firestore();
    const dbC = testEnv.authenticatedContext(outsiderC).firestore();

    // Member B can read users/A/medicines/med1 -> ALLOWED
    await assertSucceeds(getDoc(doc(dbB, 'users', ownerA, 'medicines', 'med1')));

    // Member B can write users/A/medicines/med2 -> ALLOWED
    await assertSucceeds(
      setDoc(doc(dbB, 'users', ownerA, 'medicines', 'med2'), {
        name: 'Vitamin D',
        dosage: 1000,
      })
    );

    // Outsider C tries to read users/A/medicines/med1 -> DENIED
    await assertFails(getDoc(doc(dbC, 'users', ownerA, 'medicines', 'med1')));

    // Outsider C tries to write users/A/medicines/med3 -> DENIED
    await assertFails(
      setDoc(doc(dbC, 'users', ownerA, 'medicines', 'med3'), {
        name: 'Malicious Medicine',
        dosage: 500,
      })
    );
  });

  it('private user profile test: Member B cannot read or write users/A profile document', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'households', ownerA), {
        ownerUid: ownerA,
        members: {
          [ownerA]: { role: 'owner', name: 'Alice', email: 'alice@test.com', joinedAt: '2026-01-01' },
          [memberB]: { role: 'member', name: 'Bob', email: 'bob@test.com', joinedAt: '2026-01-01' },
        },
        createdAt: '2026-01-01',
      });

      await setDoc(doc(context.firestore(), 'users', ownerA), {
        name: 'Alice Private Profile',
        email: 'alice@private.com',
      });
    });

    const dbB = testEnv.authenticatedContext(memberB).firestore();
    const dbA = testEnv.authenticatedContext(ownerA).firestore();

    // Owner A can read own profile -> ALLOWED
    await assertSucceeds(getDoc(doc(dbA, 'users', ownerA)));

    // Member B cannot read owner A's profile doc -> DENIED
    await assertFails(getDoc(doc(dbB, 'users', ownerA)));

    // Member B cannot write to owner A's profile doc -> DENIED
    await assertFails(
      setDoc(doc(dbB, 'users', ownerA), {
        name: 'Hacked Profile',
      })
    );
  });

  it('user_household_memberships is scoped to the authenticated user', async () => {
    const dbA = testEnv.authenticatedContext(ownerA).firestore();
    const dbB = testEnv.authenticatedContext(memberB).firestore();

    // User A can read/write their own membership doc
    await assertSucceeds(
      setDoc(doc(dbA, 'user_household_memberships', ownerA), {
        householdIds: [ownerA],
        activeHouseholdId: ownerA,
      })
    );

    // User B cannot read user A's membership doc
    await assertFails(getDoc(doc(dbB, 'user_household_memberships', ownerA)));

    // User B cannot write user A's membership doc
    await assertFails(
      setDoc(doc(dbB, 'user_household_memberships', ownerA), {
        householdIds: [ownerA, memberB],
        activeHouseholdId: memberB,
      })
    );
  });

  it('allows a newly registered user to get their household doc (even before it exists) and read/write their own subcollections', async () => {
    const newUserId = 'user_new_fresh_123';
    const dbNew = testEnv.authenticatedContext(newUserId).firestore();

    // Owner can read their household doc before it exists without permission errors
    await assertSucceeds(getDoc(doc(dbNew, 'households', newUserId)));

    // Owner can create their household doc
    await assertSucceeds(
      setDoc(doc(dbNew, 'households', newUserId), {
        ownerUid: newUserId,
        members: {
          [newUserId]: { role: 'owner', name: 'Fresh User', email: 'fresh@test.com', joinedAt: '2026-01-01' },
        },
        createdAt: '2026-01-01',
      })
    );

    // Owner can read and write their own subcollections (notifications, transactions, etc.)
    await assertSucceeds(
      setDoc(doc(dbNew, 'users', newUserId, 'notifications', 'notif_1'), {
        message: 'Welcome to Sprout',
        createdAt: '2026-01-01',
      })
    );
    await assertSucceeds(getDoc(doc(dbNew, 'users', newUserId, 'notifications', 'notif_1')));
  });
});
