// Auto-generated from trip_coordinator_mock_data_v2.xlsx
// Fake/mock data for building the dashboard UI before real AWS data exists.
// paid is now a real boolean, split_among_user_ids is a real number array
// -- both were text/strings in the original spreadsheet.

export const mockData = {
  "users": [
    {
      "user_id": 1,
      "name": "Alex",
      "age": 21,
      "dietary_needs": "Vegetarian",
      "blacklist_activities": "Bungee jumping",
      "blacklist_food": "None",
      "email": "alex@example.com"
    },
    {
      "user_id": 2,
      "name": "Sam",
      "age": 22,
      "dietary_needs": "None",
      "blacklist_activities": "None",
      "blacklist_food": "Seafood",
      "email": "sam@example.com"
    },
    {
      "user_id": 3,
      "name": "Jo",
      "age": 20,
      "dietary_needs": "Gluten-free",
      "blacklist_activities": "None",
      "blacklist_food": "None",
      "email": "jo@example.com"
    },
    {
      "user_id": 4,
      "name": "Priya",
      "age": 23,
      "dietary_needs": "None",
      "blacklist_activities": "Extreme heights",
      "blacklist_food": "None",
      "email": "priya@example.com"
    },
    {
      "user_id": 5,
      "name": "Marcus",
      "age": 22,
      "dietary_needs": "None",
      "blacklist_activities": "None",
      "blacklist_food": "None",
      "email": "marcus@example.com"
    },
    {
      "user_id": 6,
      "name": "Lena",
      "age": 21,
      "dietary_needs": "Vegan",
      "blacklist_activities": "Skydiving",
      "blacklist_food": "None",
      "email": "lena@example.com"
    },
    {
      "user_id": 7,
      "name": "Theo",
      "age": 23,
      "dietary_needs": "None",
      "blacklist_activities": "None",
      "blacklist_food": "None",
      "email": "theo@example.com"
    },
    {
      "user_id": 8,
      "name": "Nadia",
      "age": 20,
      "dietary_needs": "Nut allergy",
      "blacklist_activities": "None",
      "blacklist_food": "Spicy food",
      "email": "nadia@example.com"
    }
  ],
  "groups": [
    {
      "group_id": 1,
      "trip_name": "Osaka Weekend",
      "destination": "Osaka, Japan",
      "start_date": "2026-11-14",
      "end_date": "2026-11-17",
      "invite_code": "OSK4TRIP",
      "organizer_user_id": 4
    },
    {
      "group_id": 2,
      "trip_name": "NZ South Island Roadtrip",
      "destination": "South Island, New Zealand",
      "start_date": "2026-12-05",
      "end_date": "2026-12-11",
      "invite_code": "NZSI2026",
      "organizer_user_id": 7
    }
  ],
  "tripPreferences": [
    {
      "group_id": 1,
      "user_id": 1,
      "budget_range": "$ (tight, under $300)",
      "must_do_activities": "Museums, hiking",
      "date_flexibility": "Flexible",
      "notes": "On a student budget, avoid pricey add-ons"
    },
    {
      "group_id": 1,
      "user_id": 2,
      "budget_range": "$$$ (over $800)",
      "must_do_activities": "Fine dining, shopping",
      "date_flexibility": "Fixed dates only",
      "notes": "Wants at least 1 nice dinner"
    },
    {
      "group_id": 1,
      "user_id": 3,
      "budget_range": "$$ ($300-500)",
      "must_do_activities": "Hiking, beach, local food",
      "date_flexibility": "Flexible",
      "notes": "Needs gluten-free food options nearby"
    },
    {
      "group_id": 1,
      "user_id": 4,
      "budget_range": "$$ ($300-500)",
      "must_do_activities": "Shopping, nightlife",
      "date_flexibility": "Fixed dates only",
      "notes": "Not a fan of early mornings"
    },
    {
      "group_id": 2,
      "user_id": 5,
      "budget_range": "$$ ($500-900)",
      "must_do_activities": "Hiking, road trip stops, photography",
      "date_flexibility": "Flexible",
      "notes": "Wants to drive part of the route"
    },
    {
      "group_id": 2,
      "user_id": 6,
      "budget_range": "$ (tight, under $500)",
      "must_do_activities": "Hiking, nature walks",
      "date_flexibility": "Flexible",
      "notes": "Vegan-friendly stops needed daily"
    },
    {
      "group_id": 2,
      "user_id": 7,
      "budget_range": "$$$ (over $1200)",
      "must_do_activities": "Skydiving, bungee, adventure sports",
      "date_flexibility": "Fixed dates only",
      "notes": "Organizing the trip, has a car"
    },
    {
      "group_id": 2,
      "user_id": 8,
      "budget_range": "$$ ($500-900)",
      "must_do_activities": "Scenic drives, wildlife spotting",
      "date_flexibility": "Fixed dates only",
      "notes": "Nut allergy \u2014 needs to check every stop in advance"
    }
  ],
  "itinerary": [
    {
      "group_id": 1,
      "day": 1,
      "date": "2026-11-14",
      "activity": "Arrive, check into hotel",
      "est_cost_per_person": 0,
      "split_among_user_ids": [
        1,
        2,
        3,
        4
      ],
      "flag": null
    },
    {
      "group_id": 1,
      "day": 1,
      "date": "2026-11-14",
      "activity": "Dotonbori food walk",
      "est_cost_per_person": 15,
      "split_among_user_ids": [
        1,
        2,
        3,
        4
      ],
      "flag": "Jo needs gluten-free stall list"
    },
    {
      "group_id": 1,
      "day": 2,
      "date": "2026-11-15",
      "activity": "Osaka Castle + museum",
      "est_cost_per_person": 12,
      "split_among_user_ids": [
        1,
        2,
        3,
        4
      ],
      "flag": null
    },
    {
      "group_id": 1,
      "day": 2,
      "date": "2026-11-15",
      "activity": "Fine dining dinner (Sam's pick)",
      "est_cost_per_person": 90,
      "split_among_user_ids": [
        2,
        4
      ],
      "flag": "Budget conflict: exceeds Alex's daily cap, so opted out"
    },
    {
      "group_id": 1,
      "day": 3,
      "date": "2026-11-16",
      "activity": "Minoo hiking trail",
      "est_cost_per_person": 5,
      "split_among_user_ids": [
        1,
        3
      ],
      "flag": "Sam and Priya opted out (prefer shopping)"
    },
    {
      "group_id": 1,
      "day": 3,
      "date": "2026-11-16",
      "activity": "Shinsaibashi shopping",
      "est_cost_per_person": 0,
      "split_among_user_ids": [
        2,
        4
      ],
      "flag": null
    },
    {
      "group_id": 1,
      "day": 4,
      "date": "2026-11-17",
      "activity": "Depart",
      "est_cost_per_person": 0,
      "split_among_user_ids": [
        1,
        2,
        3,
        4
      ],
      "flag": null
    },
    {
      "group_id": 2,
      "day": 1,
      "date": "2026-12-05",
      "activity": "Arrive Christchurch, pick up rental car",
      "est_cost_per_person": 40,
      "split_among_user_ids": [
        5,
        6,
        7,
        8
      ],
      "flag": "Theo covers deposit, split on arrival"
    },
    {
      "group_id": 2,
      "day": 2,
      "date": "2026-12-06",
      "activity": "Drive to Aoraki/Mt Cook, scenic stops",
      "est_cost_per_person": 0,
      "split_among_user_ids": [
        5,
        6,
        7,
        8
      ],
      "flag": null
    },
    {
      "group_id": 2,
      "day": 2,
      "date": "2026-12-06",
      "activity": "Hooker Valley hike",
      "est_cost_per_person": 0,
      "split_among_user_ids": [
        5,
        6,
        8
      ],
      "flag": "Theo opted out, doing tandem skydive instead"
    },
    {
      "group_id": 2,
      "day": 2,
      "date": "2026-12-06",
      "activity": "Tandem skydive (Theo)",
      "est_cost_per_person": 320,
      "split_among_user_ids": [
        7
      ],
      "flag": "Solo cost, not split with group"
    },
    {
      "group_id": 2,
      "day": 3,
      "date": "2026-12-07",
      "activity": "Drive to Wanaka, lakeside picnic",
      "est_cost_per_person": 20,
      "split_among_user_ids": [
        5,
        6,
        7,
        8
      ],
      "flag": "Nadia to confirm no nuts in shared snacks"
    },
    {
      "group_id": 2,
      "day": 4,
      "date": "2026-12-08",
      "activity": "Queenstown bungee jump",
      "est_cost_per_person": 220,
      "split_among_user_ids": [
        7,
        8
      ],
      "flag": "Lena and Marcus opted out (Lena's blacklist + budget)"
    },
    {
      "group_id": 2,
      "day": 4,
      "date": "2026-12-08",
      "activity": "Queenstown town exploring",
      "est_cost_per_person": 0,
      "split_among_user_ids": [
        5,
        6,
        7,
        8
      ],
      "flag": null
    },
    {
      "group_id": 2,
      "day": 5,
      "date": "2026-12-09",
      "activity": "Milford Sound day cruise",
      "est_cost_per_person": 130,
      "split_among_user_ids": [
        5,
        6,
        7,
        8
      ],
      "flag": null
    },
    {
      "group_id": 2,
      "day": 6,
      "date": "2026-12-10",
      "activity": "Free day / laundry / rest",
      "est_cost_per_person": 0,
      "split_among_user_ids": [
        5,
        6,
        7,
        8
      ],
      "flag": null
    },
    {
      "group_id": 2,
      "day": 7,
      "date": "2026-12-11",
      "activity": "Drive back to Christchurch, depart",
      "est_cost_per_person": 0,
      "split_among_user_ids": [
        5,
        6,
        7,
        8
      ],
      "flag": null
    }
  ],
  "payments": [
    {
      "group_id": 1,
      "activity_ref": "Airport taxi (Sam covered)",
      "from_user_id": 1,
      "to_user_id": 2,
      "amount_owed": 8,
      "paid": "No"
    },
    {
      "group_id": 1,
      "activity_ref": "Airport taxi (Sam covered)",
      "from_user_id": 3,
      "to_user_id": 2,
      "amount_owed": 8,
      "paid": "No"
    },
    {
      "group_id": 1,
      "activity_ref": "Konbini snack run (Alex covered)",
      "from_user_id": 3,
      "to_user_id": 1,
      "amount_owed": 6,
      "paid": "No"
    },
    {
      "group_id": 1,
      "activity_ref": "Konbini snack run (Alex covered)",
      "from_user_id": 4,
      "to_user_id": 1,
      "amount_owed": 6,
      "paid": "Yes"
    },
    {
      "group_id": 1,
      "activity_ref": "Dotonbori food walk",
      "from_user_id": 1,
      "to_user_id": 4,
      "amount_owed": 15,
      "paid": false
    },
    {
      "group_id": 1,
      "activity_ref": "Dotonbori food walk",
      "from_user_id": 2,
      "to_user_id": 4,
      "amount_owed": 15,
      "paid": true
    },
    {
      "group_id": 1,
      "activity_ref": "Dotonbori food walk",
      "from_user_id": 3,
      "to_user_id": 4,
      "amount_owed": 15,
      "paid": false
    },
    {
      "group_id": 1,
      "activity_ref": "Osaka Castle + museum",
      "from_user_id": 1,
      "to_user_id": 4,
      "amount_owed": 12,
      "paid": false
    },
    {
      "group_id": 1,
      "activity_ref": "Osaka Castle + museum",
      "from_user_id": 2,
      "to_user_id": 4,
      "amount_owed": 12,
      "paid": true
    },
    {
      "group_id": 1,
      "activity_ref": "Osaka Castle + museum",
      "from_user_id": 3,
      "to_user_id": 4,
      "amount_owed": 12,
      "paid": false
    },
    {
      "group_id": 1,
      "activity_ref": "Fine dining dinner",
      "from_user_id": 2,
      "to_user_id": 4,
      "amount_owed": 90,
      "paid": false
    },
    {
      "group_id": 1,
      "activity_ref": "Minoo hiking trail",
      "from_user_id": 1,
      "to_user_id": 4,
      "amount_owed": 5,
      "paid": false
    },
    {
      "group_id": 1,
      "activity_ref": "Minoo hiking trail",
      "from_user_id": 3,
      "to_user_id": 4,
      "amount_owed": 5,
      "paid": false
    },
    {
      "group_id": 2,
      "activity_ref": "Rental car pickup",
      "from_user_id": 5,
      "to_user_id": 7,
      "amount_owed": 40,
      "paid": false
    },
    {
      "group_id": 2,
      "activity_ref": "Rental car pickup",
      "from_user_id": 6,
      "to_user_id": 7,
      "amount_owed": 40,
      "paid": true
    },
    {
      "group_id": 2,
      "activity_ref": "Rental car pickup",
      "from_user_id": 8,
      "to_user_id": 7,
      "amount_owed": 40,
      "paid": false
    },
    {
      "group_id": 2,
      "activity_ref": "Lakeside picnic",
      "from_user_id": 5,
      "to_user_id": 7,
      "amount_owed": 20,
      "paid": true
    },
    {
      "group_id": 2,
      "activity_ref": "Lakeside picnic",
      "from_user_id": 6,
      "to_user_id": 7,
      "amount_owed": 20,
      "paid": false
    },
    {
      "group_id": 2,
      "activity_ref": "Lakeside picnic",
      "from_user_id": 8,
      "to_user_id": 7,
      "amount_owed": 20,
      "paid": false
    },
    {
      "group_id": 2,
      "activity_ref": "Queenstown bungee jump",
      "from_user_id": 8,
      "to_user_id": 7,
      "amount_owed": 220,
      "paid": false
    },
    {
      "group_id": 2,
      "activity_ref": "Milford Sound day cruise",
      "from_user_id": 5,
      "to_user_id": 7,
      "amount_owed": 130,
      "paid": false
    },
    {
      "group_id": 2,
      "activity_ref": "Milford Sound day cruise",
      "from_user_id": 6,
      "to_user_id": 7,
      "amount_owed": 130,
      "paid": false
    },
    {
      "group_id": 2,
      "activity_ref": "Milford Sound day cruise",
      "from_user_id": 8,
      "to_user_id": 7,
      "amount_owed": 130,
      "paid": true
    }
  ]
};

export default mockData;
