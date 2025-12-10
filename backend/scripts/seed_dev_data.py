"""
Development helper to seed baseline scripts and deployment profiles.

Usage:
    cd backend
    python -m scripts.seed_dev_data

This is destructive only in the sense that it inserts default records if they
are missing. It will not drop any tables.
"""
from app.core.config import get_settings
from app.db import Base, SessionLocal, engine
from app.models.deployment_profile import DeploymentProfile
from app.models.profile_task import ProfileTask
from app.models.script import Script


DEFAULT_SCRIPT_NAME = "Ping WAN (Windows)"
DEFAULT_PROFILE_NAME = "Baseline Windows Profile"


def seed() -> None:
    """Create baseline dev data if it does not already exist."""
    settings = get_settings()
    print("\n=== DeployFlow Dev Seed ===")
    print(f"DATABASE_URL: {settings.database_url}\n")

    # Ensure tables exist before seeding
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        script = db.query(Script).filter(Script.name == DEFAULT_SCRIPT_NAME).first()
        if not script:
            script = Script(
                name=DEFAULT_SCRIPT_NAME,
                description="Ping 1.1.1.1 to validate outbound connectivity",
                language="powershell",
                target_os_type="windows",
                content="Test-Connection -ComputerName 1.1.1.1 -Count 4 | Out-String",
            )
            db.add(script)
            db.flush()
            print(f"Created script: {script.name} (id={script.id})")
        else:
            print(f"Script already exists: {script.name} (id={script.id})")

        profile = (
            db.query(DeploymentProfile)
            .filter(DeploymentProfile.name == DEFAULT_PROFILE_NAME)
            .first()
        )
        if not profile:
            profile = DeploymentProfile(
                name=DEFAULT_PROFILE_NAME,
                description="Baseline Windows connectivity check",
                target_os_type="windows",
                is_template=False,
            )
            db.add(profile)
            db.flush()
            print(f"Created profile: {profile.name} (id={profile.id})")
        else:
            print(f"Profile already exists: {profile.name} (id={profile.id})")

        existing_task = (
            db.query(ProfileTask)
            .filter(ProfileTask.profile_id == profile.id, ProfileTask.script_id == script.id)
            .first()
        )
        if not existing_task:
            task = ProfileTask(
                profile_id=profile.id,
                name="Ping WAN",
                description="Ensure outbound network reachability",
                order_index=0,
                action_type="powershell_inline",
                script_id=script.id,
                continue_on_error=True,
            )
            db.add(task)
            print(
                f"Added task to profile {profile.name}: {task.name} using script id {script.id}"
            )
        else:
            print("Profile already has Ping WAN task; skipping task creation.")

        db.commit()
        print("\nSeeding complete.\n")
    finally:
        db.close()


def main() -> None:
    seed()


if __name__ == "__main__":
    main()
