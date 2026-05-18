import { test, expect } from "../../../fixtures";
import { NotesService } from "../../../services/NotesService";

test.describe("Notes CRUD - happy paths", () => {
  let createdIds: string[];

  test.beforeEach(() => {
    createdIds = [];
  });

  test.afterEach(async ({ authedRequest }) => {
    const notes = new NotesService(authedRequest);
    for (const id of createdIds) {
      await notes.deleteById(id); // ignore response - TC may have deleted already
    }
  });

  test("TC01 - POST /notes - happy path", async ({ authedRequest }) => {
    const notes = new NotesService(authedRequest);
    const payload = {
      title: "Buy gym supplements",
      description: "Creatine, Vitamins, Protein powder",
      category: "Personal",
    };

    const response = await notes.create(payload);
    const body = await response.json();

    // PUSH for cleanup before assertions - a failing assertion below
    // still leaves a deleteable id behind. Guarded for the unlikely
    // case where create failed and data.id doesn't exist.
    if (body?.data?.id) createdIds.push(body.data.id);

    expect(response.status()).toBe(200); // 200 not 201 — Notes API gotcha
    expect(body).toMatchObject({
      success: true,
      status: 200,
      message: "Note successfully created",
      data: {
        id: expect.stringMatching(/^[a-f0-9]{24}$/),
        title: payload.title,
        description: payload.description,
        category: payload.category,
        completed: false,
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        user_id: expect.stringMatching(/^[a-f0-9]{24}$/),
      },
    });
    expect(body.data.created_at).toEqual(body.data.updated_at); // On initial create, server initializes updated_at = created_at
  });

  test("TC02 - GET /notes - empty list", async ({ authedRequest }) => {
    const notes = new NotesService(authedRequest);
    const response = await notes.list();
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("No notes found");
    expect(body.data).toEqual([]); // authedRequest fixture registers a fresh user per worker — this user
    // has never created a note, so the list is guaranteed empty.
  });

  test("TC03 - GET /notes - populated list", async ({ authedRequest }) => {
    const notes = new NotesService(authedRequest);
    const payload = {
      title: "Test GET populated list",
      description: "Testing get request for /notes",
      category: "Work",
    };

    const createResponse = await notes.create(payload);
    const createBody = await createResponse.json();
    const createdNoteId = createBody?.data?.id;
    if (createdNoteId) createdIds.push(createdNoteId);

    expect(createResponse.status()).toBe(200);

    const listResponse = await notes.list();
    const listBody = await listResponse.json();

    expect(listResponse.status()).toBe(200);
    expect(listBody.success).toBe(true);
    expect(listBody.status).toBe(200);
    expect(listBody.message).toBe("Notes successfully retrieved");
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].id).toBe(createdNoteId);
    expect(listBody.data[0].title).toBe(payload.title);
  });

  test("TC04 - GET /notes/{id} - single note", async ({ authedRequest }) => {
    const notes = new NotesService(authedRequest);
    const payload = {
      title: "Test GET single note",
      description: "Testing get request for /notes{id}",
      category: "Work",
    };

    const createResponse = await notes.create(payload);
    const createBody = await createResponse.json();
    const createdNoteId = createBody?.data?.id;
    if (createdNoteId) createdIds.push(createdNoteId);

    expect(createResponse.status()).toBe(200);

    const singleNoteResp = await notes.getById(createdNoteId);

    const singleNoteBody = await singleNoteResp.json();
    expect(singleNoteResp.status()).toBe(200);
    expect(singleNoteBody.success).toBe(true);
    expect(singleNoteBody.status).toBe(200);
    expect(singleNoteBody.message).toBe("Note successfully retrieved");
    expect(singleNoteBody.data).toEqual(createBody.data);
  });

  test("TC05 - PUT /notes/{id} - full replace: all four fields change", async ({
    authedRequest,
  }) => {
    const notes = new NotesService(authedRequest);
    const originalPayload = {
      title: "Test PUT single note",
      description: "Testing PUT request for /notes/{id}",
      category: "Work",
    };

    const createResponse = await notes.create(originalPayload);
    const originalBody = await createResponse.json();
    const originalNoteId = originalBody?.data?.id;
    if (originalNoteId) createdIds.push(originalNoteId);
    const originalNoteCreateDate = originalBody.data.created_at;
    const originalNoteUpdateDate = originalBody.data.updated_at;

    expect(originalNoteCreateDate).toEqual(originalNoteUpdateDate);

    expect(createResponse.status()).toBe(200);

    const updatedPayload = {
      title: "Update note",
      description: "PUT test successful",
      completed: true,
      category: "Personal",
    };

    const updated = await notes.update(originalNoteId, updatedPayload);

    expect(updated.status()).toBe(200);

    const updatedBody = await updated.json();
    expect(updatedBody.success).toBe(true);
    expect(updatedBody.status).toBe(200);
    expect(updatedBody.message).toBe("Note successfully Updated");
    expect(updatedBody.data).toMatchObject({
      title: updatedPayload.title,
      description: updatedPayload.description,
      completed: updatedPayload.completed,
      category: updatedPayload.category,
    });

    expect(updatedBody.data.created_at).toBe(originalNoteCreateDate);
    expect(new Date(updatedBody.data.updated_at).getTime()).toBeGreaterThan(
      new Date(originalNoteUpdateDate).getTime(),
    );
  });

  test("TC06 - DELETE /notes/{id} happy path with state-transition verification", async ({
    authedRequest,
  }) => {
    const notes = new NotesService(authedRequest);
    const payload = {
      title: "Test DELETE single note",
      description: "Testing DELETE request for /notes/{id}",
      category: "Work",
    };

    const response = await notes.create(payload);
    const body = await response.json();
    const noteId = body?.data?.id;
    if (noteId) createdIds.push(noteId);

    expect(response.status()).toBe(200);

    const deleteRes = await notes.deleteById(noteId);
    expect(deleteRes.status()).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.status).toBe(200);
    expect(deleteBody.success).toBe(true);
    expect(deleteBody.message).toBe("Note successfully deleted");

    // DELETE returning 200 doesn't prove the note is gone — confirm via GET.
    const getNoteRes = await notes.getById(noteId);
    expect(getNoteRes.status()).toBe(404);

    const getNoteBody = await getNoteRes.json();
    expect(getNoteBody.status).toBe(404);
    expect(getNoteBody.success).toBe(false);
    expect(getNoteBody.message).toBe(
      "No note was found with the provided ID, Maybe it was deleted",
    );
  });
});

test.describe("Notes - Patch completion-toggle state transition", () => {
  let createdIds: string[];
  let noteId: string;
  let notes: NotesService;
  const setupPayload = {
    title: "PATCH transition note",
    description: "Note under test for completion toggle",
    category: "Work",
  };
  let originalCreatedAt: string;
  let originalUpdatedAt: string;

  test.beforeEach(async ({ authedRequest }) => {
    createdIds = [];
    notes = new NotesService(authedRequest);
    const response = await notes.create(setupPayload);
    const body = await response.json();
    noteId = body.data.id;
    createdIds.push(noteId);
    originalCreatedAt = body.data.created_at;
    originalUpdatedAt = body.data.updated_at;
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await notes.deleteById(id);
    }
  });

  test("TC07 - PATCH /notes/{id} - completed:false → true", async () => {
    const result = await notes.patchCompleted(noteId, true);
    expect(result.status()).toBe(200);

    const body = await result.json();
    expect(body.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Note successfully Updated");
    expect(body.data.completed).toBe(true);
    expect(body.data.title).toBe(setupPayload.title);
    expect(body.data.description).toBe(setupPayload.description);
    expect(body.data.category).toBe(setupPayload.category);
    expect(body.data.id).toBe(noteId);
    expect(body.data.created_at).toBe(originalCreatedAt);
    expect(new Date(body.data.updated_at).getTime()).toBeGreaterThan(
      new Date(originalUpdatedAt).getTime(),
    );
  });

  test("TC08 - PATCH /notes/{id} - completed: true → false → false(round-trip)", async () => {
    const result = await notes.patchCompleted(noteId, true);
    expect(result.status()).toBe(200);

    const result2 = await notes.patchCompleted(noteId, false);
    expect(result2.status()).toBe(200);

    const body = await result2.json();
    expect(body.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Note successfully Updated");
    expect(body.data.completed).toBe(false);
    expect(body.data.title).toBe(setupPayload.title);
    expect(body.data.description).toBe(setupPayload.description);
    expect(body.data.category).toBe(setupPayload.category);
    expect(body.data.id).toBe(noteId);
    expect(body.data.created_at).toBe(originalCreatedAt);
    expect(new Date(body.data.updated_at).getTime()).toBeGreaterThan(
      new Date(originalUpdatedAt).getTime(),
    );
  });

  test("TC09 - PATCH /notes/{id} - idempotent on already-complete", async () => {
    const result = await notes.patchCompleted(noteId, true);
    expect(result.status()).toBe(200);

    const result2 = await notes.patchCompleted(noteId, true);
    expect(result2.status()).toBe(200);

    const body = await result2.json();
    expect(body.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Note successfully Updated");
    expect(body.data.completed).toBe(true);
    expect(body.data.title).toBe(setupPayload.title);
    expect(body.data.description).toBe(setupPayload.description);
    expect(body.data.category).toBe(setupPayload.category);
    expect(body.data.id).toBe(noteId);
    expect(body.data.created_at).toBe(originalCreatedAt);
    // Idempotency here is about the OUTCOME (completed stays true), not the
    // side effects. The Notes API bumps updated_at on every PATCH including
    // no-op writes
    expect(new Date(body.data.updated_at).getTime()).toBeGreaterThan(
      new Date(originalUpdatedAt).getTime(),
    );
  });
});

test.describe("Notes - category enum validation", () => {
  let createdIds: string[];

  test.beforeEach(() => {
    createdIds = [];
  });

  test.afterEach(async ({ authedRequest }) => {
    const notes = new NotesService(authedRequest);
    for (const id of createdIds) {
      await notes.deleteById(id);
    }
  });

  const validCategories = [
    { tc: "TC10", category: "Home" },
    { tc: "TC11", category: "Work" },
    { tc: "TC12", category: "Personal" },
  ];

  for (const { tc, category } of validCategories) {
    test(`${tc} - POST /notes - valid category ${category}`, async ({
      authedRequest,
    }) => {
      const notes = new NotesService(authedRequest);
      const result = await notes.create({
        title: "POST - valid category",
        description: "TEST POST",
        category,
      });

      expect(result.status()).toBe(200);
      const body = await result.json();
      if (body?.data?.id) createdIds.push(body.data.id);

      expect(body.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Note successfully created");
      expect(body.data.category).toBe(category);
    });
  }

  test("TC13 - POST /notes - invalid category 'Banana'", async ({
    authedRequest,
  }) => {
    const notes = new NotesService(authedRequest);
    const result = await notes.create({
      title: "POST - invalid category",
      description: "TEST POST with invalid category",
      category: "Banana",
    });
    expect(result.status()).toBe(400);
    const body = await result.json();
    expect(body.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe(
      "Category must be one of the categories: Home, Work, Personal",
    );
  });

  test("TC14 - POST /notes - case-sensitive: lowercase 'work' rejected", async ({
    authedRequest,
  }) => {
    // Same assertion as TC13 — different EP class (case mismatch vs. invalid value),
    // identical server response. Keep both: documents the case-sensitivity property.
    const notes = new NotesService(authedRequest);
    const result = await notes.create({
      title: "POST - case-sensitive category",
      description: "TEST POST with case-sensitive category",
      category: "work",
    });
    expect(result.status()).toBe(400);
    const body = await result.json();
    expect(body.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe(
      "Category must be one of the categories: Home, Work, Personal",
    );
  });
});
