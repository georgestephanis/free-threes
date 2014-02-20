/*global document, CustomEvent */

/**
 * For simplicity's sake, all pushes are calculated
 * to the right, and all turns are done clockwise.
 */

(function (window, document, console) {
	'use strict';

	var $board, board, next_up, has_changed;

	function compare_rows(row_1, row_2) {
		var column;

		if (!row_1 || !row_2) {
			return false;
		}

		if (!row_1.length || !row_2.length) {
			return false;
		}

		if (row_1.length !== row_2.length) {
			return false;
		}

		for (column = 0; column < row_1.length; column += 1) {
			if (row_1[column] !== row_2[column]) {
				return false;
			}
		}

		return true;
	}

	function print_board(board, el) {
		var html = '<div class="board">', row, column;

		for (row = 0; row < board.length; row += 1) {
			html += '<div class="row">';
			for (column = 0; column < board[row].length; column += 1) {
				html += '<span data-row="' + row + '" data-column="' + column + '" class="cell cell-contains-' + board[row][column] + '">' + board[row][column] + '</span>';
			}
			html += '</div>';
		}

		html += '</div>';

		html += '<p class="next-up">Next Up: <span class="next-up-' + next_up + '">' + next_up + '</span></p>';

		el.innerHTML = html;

		if (console && console.table) {
			console.table(board);
		}
	}

	/**
	 * Needs to be written to base it on the board contents.
	 * For the moment, just add a 1, 2, or 3.
     *
     * This should, I believe add up to two steps below the
     * max number currently on the board?
	 */
	function generate_next_up() {
		return Math.ceil(Math.random() * 3);
	}

    function generate_new_board(rows, columns) {
        var board = [], row, column, cell;

        for (row = 0; row < rows; row += 1) {
			board.unshift([]);
		}

        for (row = 0; row < rows; row += 1) {
			for (column = 0; column < columns; column += 1) {
                cell = Math.ceil(Math.random() * 10);
                if (cell >= 3) {
                    cell = 0;
                }
				board[row][column] = cell;
			}
		}

        return board;
    }

	function can_cells_merge(cell_1, cell_2) {
		if (0 === cell_1 || 0 === cell_2) {
			return cell_1 + cell_2;
		}
		if (3 === cell_1 + cell_2) {
			return cell_1 + cell_2;
		}
		if ((cell_1 >= 3) && (cell_2 >= 3) && (cell_1 === cell_2)) {
			return cell_1 + cell_2;
		}
		return false;
	}

	function advance_row_right(row_raw) {
		var column, sum, row = row_raw.slice(0);
		for (column = row.length - 1; column > 0; column -= 1) {
			sum = can_cells_merge(row[column], row[column - 1]);
			if (sum) {
				row[column] = sum;
				for (column -= 1; column > 0; column -= 1) {
					row[column] = row[column - 1];
				}
				row[0] = 0;
				break;
			}
		}
		return row;
	}

	function advance_board_right(board) {
		var row, new_row, advanced_rows = [];
		for (row = 0; row < board.length; row += 1) {
			new_row = advance_row_right(board[row]);
			if (!compare_rows(new_row, board[row])) {
				advanced_rows.push(row);
				board[row] = new_row;
			}
		}

		// If we've moved something, add in the next_up!
		if (advanced_rows.length) {
			has_changed = true;
			row = advanced_rows[Math.floor(Math.random() * advanced_rows.length)];
			board[row][0] = next_up;
		}
		return board;
	}

	function rotate_board_quarter_turn(board) {
		var old_height = board.length,
			old_width = board[0].length,
			new_board = [],
			row,
			column;

		for (column = 0; column < old_height; column += 1) {
			new_board.unshift([]);
		}

		for (row = 0; row < old_height; row += 1) {
			for (column = 0; column < board[row].length; column += 1) {
				new_board[column][old_height - row - 1] = board[row][column];
			}
		}

		return new_board;
	}

	function rotate_board(board, quarter_turns) {
		var turns;
		for (turns = 0; turns < quarter_turns; turns += 1) {
			board = rotate_board_quarter_turn(board);
		}
		return board;
	}

	function advance_board(board, direction) {
		var turns_before, turns_after;
		switch (direction) {
		case 'up':
			turns_before = 1;
			turns_after  = 3;
			break;
		case 'right':
			turns_before = 0;
			turns_after  = 0;
			break;
		case 'down':
			turns_before = 3;
			turns_after  = 1;
			break;
		case 'left':
			turns_before = 2;
			turns_after  = 2;
			break;
		}

		has_changed = false;

		board = rotate_board(board, turns_before);
		board = advance_board_right(board);
		board = rotate_board(board, turns_after);

		if (has_changed) {
			next_up = generate_next_up();
		}

		return board;
	}

	function get_available_directions(board) {
		return {
			up    : true,
			right : true,
			left  : true,
			down  : true
		};
	}

    function new_game() {
        board   = generate_new_board(4, 4);
        next_up = generate_next_up();
        print_board(board, $board);
    }

	$board = document.getElementById('board');
	new_game();

    document.getElementById('reset').addEventListener('click', new_game);

	window.addEventListener('keydown', function (event) {
		switch (event.which) {
		case 37:
			board = advance_board(board, 'left');
			break;
		case 38:
			board = advance_board(board, 'up');
			break;
		case 39:
			board = advance_board(board, 'right');
			break;
		case 40:
			board = advance_board(board, 'down');
			break;
		}
		print_board(board, $board);
	});

    // Handle swipes!
    (function (element) {
        var start_x, start_y, start_time;

        element.addEventListener('touchstart', function (event) {
            start_x    = event.changedTouches[0].pageX;
            start_y    = event.changedTouches[0].pageY;
            start_time = new Date().getTime();

            event.preventDefault();
        });

        element.addEventListener('touchmove', function (event) {
            event.preventDefault();
        });

        element.addEventListener('touchend', function (event) {
            var distance, distance_x, distance_y, distance_relevant, elapsed_time, swipe_direction, swipe_event;
            distance_x   = event.changedTouches[0].pageX - start_x;
            distance_y   = event.changedTouches[0].pageY - start_y;
            distance     = Math.sqrt(Math.pow(distance_x, 2) + Math.pow(distance_y, 2));
            elapsed_time = new Date().getTime() - start_time;

            if (Math.abs(distance_x) > Math.abs(distance_y)) {
                swipe_direction   = (distance_x < 0) ? 'left' : 'right';
                distance_relevant = Math.abs(distance_x);
            } else {
                swipe_direction = (distance_y < 0) ? 'up' : 'down';
                distance_relevant = Math.abs(distance_y);
            }

            swipe_event = new CustomEvent('threes_swipe', {
                detail : {
                    direction         : swipe_direction,
                    distance          : distance,
                    distance_x        : distance_x,
                    distance_y        : distance_y,
                    distance_relevant : distance_relevant,
                    elapsed_time      : elapsed_time
                }
            });
            element.dispatchEvent(swipe_event);

            event.preventDefault();
        });
    }($board));

    $board.addEventListener('threes_swipe', function (event) {
        if (event.detail.distance_relevant > 30) {
            board = advance_board(board, event.detail.direction);
            print_board(board, $board);
        }
    });

}(this, document, this.console));