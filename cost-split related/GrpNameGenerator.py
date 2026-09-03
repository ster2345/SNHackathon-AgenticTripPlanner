"""
Invite code generator — destination-aware format.

Format: [3-letter destination prefix][expected headcount][3 random digits]
Example: "Osaka, Japan", 4 people -> "OSA4738"

Drop into group-creation logic (wherever a new Groups record is inserted).
Only needs: the destination string and the expected number of people.
"""

import secrets
import re


def generate_invite_code(destination, num_people):
    """
    destination: string, e.g. "Osaka, Japan" or "South Island, New Zealand"
    num_people: int, expected group size at creation time
                (this does NOT update later if people join/leave —
                the code is generated once and stays fixed)
    """
    letters_only = re.sub(r'[^A-Za-z]', '', destination)
    prefix = letters_only[:3].upper().ljust(3, 'X')  # pads short names, e.g. "NZ" -> "NZX"

    people_part = str(num_people)
    random_digits = ''.join(secrets.choice('0123456789') for _ in range(3))

    return f"{prefix}{people_part}{random_digits}"


def generate_unique_invite_code(destination, num_people, code_exists_fn, max_attempts=10):
    """
    Same as above, but checks against your database for collisions and
    retries if the code's already taken.

    code_exists_fn: a function you provide that takes a code string and
                     returns True/False (e.g. queries DynamoDB Groups table
                     by invite_code and checks if a match exists)
    """
    for _ in range(max_attempts):
        code = generate_invite_code(destination, num_people)
        if not code_exists_fn(code):
            return code
    raise RuntimeError("Could not generate a unique invite code after several attempts")


if __name__ == "__main__":
    # Quick local test, no AWS needed
    print(generate_invite_code("Osaka, Japan", 4))
    print(generate_invite_code("South Island, New Zealand", 4))
    print(generate_invite_code("NZ", 2))  # tests short-name padding