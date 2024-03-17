This is an implementation of a vector database (Weaviate) for RAG (retrieval augmented generation
) designed to be hosted on your personal computer.

The advantage of storing your vector database locally is that you maintain ownership of your data, allowing for
switching between different language models, and or potentially
using different language models together for different parts of RAG (vectorisation, categorisation, retrieval, generation).

The idea is for you to be able to collect your information and develop an assistant that you can continuously feed more
information.

Currently, the program is using OpenAIs GPTs. If you'd like to contribute to the project it would be most beneficial to be able
to connect other Language Models. 

## Recommended node version

The program was developed using node v.20. You can install node v.20 using nvm:

```bash
$ nvm install 20
$ nvm use 20
```

# Features:

- memorise any data from text files
- prevent duplicate entries, by storing a hash of the text files
- simple terminal interface for interacting with the program

## Quick start

Create an `.env` file with following two variables:

```
OAI_ORG="org-xxxxxx" # Your OpenAI organisation
OAI_KEY="sk-xxxxxx" # Your OpenAI API key
SNIPPET_LENGTH_LIMIT=2000 # Leave this value as is
``` 

Run the Weaviate server

```bash
$ docker-compose up -d 
```
You can verify that weaviate is running by visiting http://localhost:8080/

Next, add data as text files to the "data" folder. It will be categorised automatically. You could download one of your whatsapp conversation as an example. Finally, run the memorisation

```bash
$ node memorise.js
```

Now you should be able to write augemnted prompts by running

```bash
$ node index.js "Your prompt"
```

## Creating the schema

Creating schema

```bash
$ curl -X POST -H "Content-Type: application/json" --data-binary "@./schemas/Memory.json" http://localhost:8080/v1/schema
````

## Clearing the database

Warning! This command will irreversibly delete all vectorised data in the database:

```bash
$ curl -X DELETE http://localhost:8080/v1/schema/Memory
```

After which you will need to recreate the schema.

The next step would be to empty the hash file that prevents duplicate entries:

```bash
$ echo -n "" > ./log/memory-log.csv
```

