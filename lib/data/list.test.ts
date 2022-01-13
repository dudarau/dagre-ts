import List from './list.js';

describe('data.List dequeue', function () {
  let list: any;

  beforeEach(function () {
    list = new List();
  });

  it('returns undefined with an empty list', function () {
    expect(list.dequeue()).toBeUndefined();
  });

  it('unlinks and returns the first entry', function () {
    const obj = {};
    list.enqueue(obj);
    expect(list.dequeue()).toEqual(obj);
  });

  it('unlinks and returns multiple entries in FIFO order', function () {
    const obj1 = {};
    const obj2 = {};
    list.enqueue(obj1);
    list.enqueue(obj2);

    expect(list.dequeue()).toEqual(obj1);
    expect(list.dequeue()).toEqual(obj2);
  });

  it('unlinks and relinks an entry if it is re-enqueued', function () {
    const obj1 = {};
    const obj2 = {};
    list.enqueue(obj1);
    list.enqueue(obj2);
    list.enqueue(obj1);

    expect(list.dequeue()).toEqual(obj2);
    expect(list.dequeue()).toEqual(obj1);
  });

  it('unlinks and relinks an entry if it is enqueued on another list', function () {
    const obj = {};
    const list2 = new List();
    list.enqueue(obj);
    list2.enqueue(obj);

    expect(list.dequeue()).toBeUndefined();
    expect(list2.dequeue()).toEqual(obj);
  });

  it('can return a string representation', function () {
    list.enqueue({ entry: 1 });
    list.enqueue({ entry: 2 });

    expect(list.toString()).toEqual('[{"entry":1}, {"entry":2}]');
  });
});
