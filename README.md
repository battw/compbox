## Refactor Plan
### Interface for the Model Computer
* machine
    * size
    * wordSize
    * accumulatorValue
    * and(address)
    * or(address)
    * xor(address)
    * not
    * leftShift
    * rightShift
    * load(address)
    * store(address)
    * read
    * write
     
### Example Program (add)
7+1 = 8

| Instruction | Arg |  Acc |    0 |    1 |    2 |
|-------------|-----|------|------|------|------|
|             |     | 0000 | 0111 | 0001 | 0000 |
| load        |   0 | 0111 |      |      |      |
| xor         |   1 | 0110 |      |      |      |
| store       |   2 |      |      |      | 0110 |
| load        |   0 | 0111 |      |      |      |
| and         |   1 | 0001 |      |      |      |
| lshift      |     | 0010 |      |      |      |
| store       |   1 |      |      | 0010 |      |
| load        |   2 | 0110 |      |      |      |
| store       |   0 |      | 0110 |      |      |
|-------------|-----|------|------|------|------|
|             |     |      | 0110 | 0010 | 0110 |
| load        |   0 | 0110 |      |      |      |
| xor         |   1 | 0100 |      |      |      |
| store       |   2 |      |      |      | 0100 |
| load        |   0 | 0110 |      |      |      |
| and         |   1 | 0010 |      |      |      |
| lshift      |     | 0100 |      |      |      |
| store       |   1 |      |      | 0100 |      |
| load        |   2 | 0100 |      |      |      |
| store       |   0 |      | 0100 |      |      |
|-------------|-----|------|------|------|------|
|             |     |      | 0100 | 0100 | 0100 |
| load        |   0 | 0100 |      |      |      |
| xor         |   1 | 0000 |      |      |      |
| store       |   2 |      |      |      | 0000 |
| load        |   0 | 0100 |      |      |      |
| and         |   1 | 0100 |      |      |      |
| lshift      |     | 1000 |      |      |      |
| store       |   1 |      |      | 1000 |      |
| load        |   2 | 0000 |      |      |      |
| store       |   0 |      | 0000 |      |      |
|-------------|-----|------|------|------|------|
|             |     |      | 0000 | 1000 | 0000 |
| load        |   0 | 0000 |      |      |      |
| xor         |   1 | 1000 |      |      |      |
| store       |   2 |      |      |      | 1000 |
| load        |   0 | 0000 |      |      |      |
| and         |   1 | 0000 |      |      |      |
| lshift      |     | 0000 |      |      |      |
| store       |   1 |      |      | 0000 |      |
| load        |   2 | 1000 |      |      |      |
| store       |   0 |      | 1000 | 0000 |      |













