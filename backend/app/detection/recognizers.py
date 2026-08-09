"""Custom Presidio recognizers for identifiers not covered by Presidio's
built-ins, kept from the original app's domain coverage (medical records,
patient/account IDs, ages) but as small, explicit, testable patterns instead
of a giant ad hoc regex dict."""

from presidio_analyzer import Pattern, PatternRecognizer

# These use a lookbehind for the label so only the identifier itself
# (not "MRN-" / "Patient ID:" / ...) is captured as the entity span - the
# labels aren't sensitive, so we shouldn't redact them too. Presidio uses
# the `regex` package under the hood, which (unlike stdlib `re`) supports
# variable-length lookbehind.
MEDICAL_RECORD_NUMBER = PatternRecognizer(
    supported_entity="MEDICAL_RECORD_NUMBER",
    name="MedicalRecordNumberRecognizer",
    patterns=[
        Pattern(
            name="mrn",
            regex=r"(?<=\bMRN[-#:\s]{0,3})\d{6,}\b",
            score=0.85,
        ),
    ],
    context=["medical", "record", "mrn", "chart"],
)

PATIENT_ID = PatternRecognizer(
    supported_entity="PATIENT_ID",
    name="PatientIdRecognizer",
    patterns=[
        Pattern(
            name="patient_id",
            regex=r"(?<=\b(?:Patient\s*ID|PAT\s*#|PT\s*#)[-:\s]{0,3})\d{4,}\b",
            score=0.85,
        ),
    ],
    context=["patient", "id"],
)

ACCOUNT_NUMBER = PatternRecognizer(
    supported_entity="ACCOUNT_NUMBER",
    name="AccountNumberRecognizer",
    patterns=[
        Pattern(
            name="account_number",
            regex=r"(?<=\b(?:Account|Acct)\s*(?:No\.?|Number|#)?[-:\s]{0,3})\d{6,}\b",
            score=0.8,
        ),
    ],
    context=["account", "acct", "bank"],
)

AGE = PatternRecognizer(
    supported_entity="AGE",
    name="AgeRecognizer",
    patterns=[
        Pattern(
            name="age_labeled",
            regex=r"(?<=\b(?:Age|aged)[:\s]{1,3})\d{1,3}\b",
            score=0.75,
        ),
        Pattern(
            name="age_years_old",
            regex=r"\b\d{1,3}[-\s](?:years?|yrs?)[-\s]old\b",
            score=0.75,
        ),
    ],
    context=["age", "years", "old"],
)

# Presidio has no general-purpose street address recognizer. spaCy's NER
# catches some addresses as LOCATION/FAC but not reliably, so we keep a
# structured pattern for the common "<number> <street name> <suffix>" shape.
ADDRESS = PatternRecognizer(
    supported_entity="ADDRESS",
    name="StreetAddressRecognizer",
    patterns=[
        Pattern(
            name="street_address",
            regex=(
                r"\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+"
                r"(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|"
                r"Way|Court|Ct|Circle|Cir|Place|Pl|Terrace|Ter|Highway|Hwy|"
                r"Parkway|Pkwy|Square|Sq)\.?\b"
            ),
            score=0.6,
        ),
    ],
    context=["address", "street", "live", "resides", "located"],
)

# Bare 5-digit numbers are too ambiguous to flag as PII on their own (order
# numbers, dosages, years...), so only match when explicitly labeled.
# "PIN code" / "Pincode" is the standard term in India and a few other
# countries, alongside "zip code" / "postal code" elsewhere.
ZIP_CODE = PatternRecognizer(
    supported_entity="ZIP_CODE",
    name="ZipCodeRecognizer",
    patterns=[
        Pattern(
            name="zip_code",
            regex=r"(?<=\b(?:zip|postal|pin)\s*code[:\s]{0,3})\d{4,6}(?:-\d{4})?\b",
            score=0.8,
        ),
        Pattern(
            name="pincode_single_word",
            regex=r"(?<=\bpincode[:\s]{0,3})\d{4,6}\b",
            score=0.8,
        ),
    ],
    context=["zip", "postal", "pin", "code"],
)

# Presidio's built-in DateRecognizer only pairs a day with a month *name* if
# they're hyphen-joined ("14-MAR-1988" / "MAR-1988"); the at-least-as-common
# space- or comma-separated form ("14 March 1988", "14th Mar, 1988") has no
# regex pattern at all and falls back entirely on spaCy's statistical NER,
# which isn't guaranteed to catch the full span (e.g. dropping the leading
# day number). Cover it deterministically instead, so an unambiguous
# calendar date reads as one regardless of what the NLP model guesses.
_MONTH_NAME_PATTERN = (
    r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|"
    r"July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
)
DATE_TEXTUAL = PatternRecognizer(
    supported_entity="DATE_TIME",
    name="TextualDateRecognizer",
    patterns=[
        Pattern(
            # Scored just above spaCy's flat 0.85 DATE score: when spaCy's
            # NER only catches part of the same span (e.g. "May 2026" out of
            # "11 May 2026"), overlap resolution keeps whichever candidate
            # has the higher confidence - this full, correctly-bounded regex
            # match should always win over a truncated statistical guess.
            name="day_month_year",
            regex=rf"\b\d{{1,2}}(?:st|nd|rd|th)?\s+{_MONTH_NAME_PATTERN}\.?,?\s+\d{{2,4}}\b",
            score=0.86,
        ),
        Pattern(
            name="month_day_year",
            regex=rf"\b{_MONTH_NAME_PATTERN}\.?\s+\d{{1,2}}(?:st|nd|rd|th)?,?\s+\d{{2,4}}\b",
            score=0.86,
        ),
        Pattern(
            name="day_month",
            regex=rf"\b\d{{1,2}}(?:st|nd|rd|th)?\s+{_MONTH_NAME_PATTERN}\b",
            score=0.55,
        ),
    ],
    context=["date", "born", "dob", "on", "dated"],
)

ALL_CUSTOM_RECOGNIZERS = [
    MEDICAL_RECORD_NUMBER,
    PATIENT_ID,
    ACCOUNT_NUMBER,
    AGE,
    ADDRESS,
    ZIP_CODE,
    DATE_TEXTUAL,
]
