# ZOOMUTEX

We have implemented Suzuki Kasami’s Mutual Exclusion algorithm’s as a way to prevent two or more people from talking over one another in a video call. 

## Implementation Detials

Please find the algorithm implemented in the following files
```shell
client/scripts/room.ts
```
This is the main function to create a room, connect and disconnect peers' audio and video. Room.ts makes use of Suzukasa.ts and token.ts to ensure Mutual Exclusion between peers.

```shell
client/Scripts/mutex.ts
```
Holds the girth of the algorithm, it will makes use of token.ts for it’s data structures

```shell
client/scripts/token.ts
```
Data structures for the Suzuki Kasami algorithm
