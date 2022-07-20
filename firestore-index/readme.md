### index management

1. firebase Cli login
> firebase login
// firebase login --reauth

2. get firestore indexes (JSON)
> firebase firestore:indexes --project twenty-style
> firebase firestore:indexes --project twenty-style-test

3. copy & paste to firestore.indexes.js and add required indexes

4. deploy
> firebase deploy --only firestore:indexes --project proj-trippi

